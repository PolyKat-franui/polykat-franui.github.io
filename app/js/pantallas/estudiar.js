// ---------- Estudiar: feed de tarjetas que se deslizan ----------
import * as prueba from '../prueba.js';
import { t, tn, tMega, tTipo, nombreIdioma } from '../i18n.js';
import * as store from '../store.js';
import { dificultad } from '../srs.js';
import { armarSesion, practicaLibre, ordenar, grupoDificultad, REINSERTAR_EN, MAX_REPETICIONES } from '../sesion.js';
import * as banco from '../banco.js';
import { hablar } from '../voz.js';
import { ICON } from '../iconos.js';
import { sonido } from '../sonido.js';
import { lluvia } from '../adornos.js';
import * as J from '../jardin.js';
import { $, $$, esc, vista, cara, toast, modal, router, cargando, marcar, sinMovimiento, estallarCorazones } from '../ui.js';
import { S, sesion, setSesion, guardar } from '../estado.js';
import { kittyAbrir } from '../kitty-chat.js';
import { actualizarChips, insignia, EMOJI_MEGA, hoyRevisadas, etapaHoy, srcFlor } from '../marco.js';
import { celebrarRacha, volarMonedas, mostrarDominada, aparecerDiamante, celebrarDiamante, mostrarPremio } from '../celebraciones.js';
import { regarJardin } from './pantalla-jardin.js';
import { contarSesion } from '../medicion.js';

export function cerrarSesion() {
  ocultarTutorial();
  if (!sesion) return;
  sesion.observer?.disconnect();
  setSesion(null);
}

function idsParaEstudiar(q, meta, nativo) {
  const lista = banco.disponibles(meta, nativo);
  if (q.get('ids')) { const elegidos = new Set(q.get('ids').split(',')); return lista.filter((c) => elegidos.has(c.id)).map((c) => c.id); }
  if (q.get('fav') === '1') {
    const favs = new Set(S.favoritos[meta] ?? []);
    return ordenar(lista.filter((c) => favs.has(c.id))).map((c) => c.id);
  }
  const mega = q.get('mega'), tema = q.get('tema'), dif = q.get('dif') || 'todas';
  return ordenar(lista.filter((c) => (!mega || c.megas.includes(mega))
    && (!tema || c.temas.includes(tema))
    && (dif === 'todas' || grupoDificultad(c) === dif))).map((c) => c.id);
}

export async function vistaEstudiar(r) {
  if (!S.aprendiendo) return void (location.hash = '#/idiomas');
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  cargando();
  await banco.prepararPar(meta, nativo);
  const ids = idsParaEstudiar(r.q, meta, nativo);
  const prog = store.progresoDe(S, meta);
  const libre = r.q.get('libre') === '1' || r.q.get('fav') === '1' || !!r.q.get('ids');
  const plan = r.q.get('ids') ? { cola: ids, motivo: 'normal' } : libre ? { cola: practicaLibre({ ids, progreso: prog }), motivo: 'normal' } : armarSesion({ ids, progreso: prog });
  const volverA = r.q.get('ids') ? '#/libre' : r.q.get('mega') ? `#/tema/${encodeURIComponent(r.q.get('mega'))}` : r.q.get('fav') ? '#/favoritos' : '#/aprender';

  if (!ids.length || !plan.cola.length) {
    const q = new URLSearchParams(r.q); q.set('libre', '1');
    vista.innerHTML = `
      <section class="pagina angosta centro vacio-estado">
        <img class="cara-grande" src="${cara(ids.length ? 'orgullosa' : 'pensando')}" alt="" width="80" height="64">
        <h1 class="display">${ids.length ? t('aldia_titulo') : t('traduccion_en_camino')}</h1>
        <p class="suave">${ids.length ? t('aldia_texto') : t('vacio_tema')}</p>
        <div class="acciones">
          ${ids.length ? `<a class="btn primario" href="#/estudiar?${q}">${t('practicar')}</a>` : ''}
          <a class="btn" href="${volverA}">${t('cambiar_tema')}</a>
        </div>
      </section>`;
    return;
  }

  setSesion({ meta, nativo, libre, sabias: 0, repasar: 0, tokens: 0, reps: {}, actual: 0, k: 0, terminada: false, ruta: location.hash, volverA });
  vista.innerHTML = `
    <section class="feed" id="feed" aria-label="${t('nav_aprender')}">
      <div class="feed-progreso" aria-hidden="true"><span class="progreso"><i id="feed-barra"></i></span><span id="feed-cuenta"></span><img class="feed-flor" id="feed-flor" src="assets/flor-0.svg" alt="" width="23" height="23"></div>
      ${plan.cola.map((id, i) => htmlSlide(id, i === 0)).join('')}
      <article class="slide fin" id="slide-fin" aria-live="polite"></article>
    </section>`;
  const feed = $('#feed');
  feed.addEventListener('click', clickFeed);
  feed.addEventListener('click', detectarDobleToque);
  activarDeslizar(feed);
  if (!S.tutorialVisto) setTimeout(iniciarTutorial, 500);
  sesion.observer = new IntersectionObserver(alVerSlide, { root: feed, threshold: 0.6 });
  $$('.slide', feed).forEach((s) => sesion.observer.observe(s));
  actualizarCuenta();
  pintarFlor();
}

/** Oración de ejemplo: aparece discreta al revelar; la nota de Kitty se abre solo si la persona curiosea. */
function htmlEjemplo(id, meta, nativo) {
  const a = banco.ejemplo(meta, id), b = banco.ejemplo(nativo, id);
  if (!a) return '';
  const nota = meta === 'en' ? b?.nota : '';
  return `
          <div class="ejemplo" aria-hidden="true">
            <p class="ej-meta" lang="${meta}">${marcar(a.ejemplo)}<button class="ej-audio" type="button" aria-label="${t('ej_escuchar')}">${ICON.audio}</button></p>
            ${b ? `<p class="ej-nativo" lang="${nativo}">${marcar(b.ejemplo)}</p>` : ''}
            ${nota ? `<details class="ej-nota"><summary>💡 ${t('ej_ojo')}</summary><p>${marcar(nota)}</p></details>` : ''}
          </div>`;
}

function htmlSlide(id, primera = false) {
  const { meta, nativo } = sesion;
  const c = banco.concepto(id);
  const a = banco.texto(meta, id), b = banco.texto(nativo, id);
  const niv = dificultad(store.progresoDe(S, meta)[id]);
  const fav = store.esFavorito(S, meta, id);
  const k = sesion.k++;
  return `
    <article class="slide${primera ? ' activa' : ''}" data-id="${id}" data-k="${k}">
      <div class="tarjeta">
        <div class="tarjeta-top">
          ${insignia(niv)}
          <span class="chip-tema"><span aria-hidden="true">${EMOJI_MEGA[c.megas[0]] ?? '🌸'}</span>${esc(tMega(c.megas[0]))}</span>
          <span class="tipo">${c.tipos.map((x) => esc(tTipo(x))).join(' · ')}</span>
        </div>
        <div class="tarjeta-centro">
          <h2 class="palabra" lang="${meta}">${esc(a.texto)}</h2>
          ${a.ipa && S.ajustes.ipa ? `<p class="ipa" lang="${meta}" title="IPA">/${esc(a.ipa)}/</p>` : ''}
          <button class="revelar" type="button" aria-expanded="false">
            <span class="traduccion" lang="${nativo}" aria-hidden="true">${esc(b.texto)}</span>
            <span class="revelar-hint">${t('toca_ver')}</span>
          </button>
          ${htmlEjemplo(id, meta, nativo)}
          ${a.borrador || b.borrador ? `<span class="borrador">${t('borrador')}</span>` : ''}
        </div>
        <div class="riel">
          <button class="riel-btn btn-fav" type="button" aria-pressed="${fav}" aria-label="${t(fav ? 'quitar_favorito' : 'favorito')}">${fav ? ICON.corazonLleno : ICON.corazon}</button>
          <button class="riel-btn btn-audio" type="button" aria-label="${t('escuchar')}">${ICON.audio}</button>
        </div>
        <button class="kitty-ayuda" type="button" aria-label="${t('kitty_abrir')}"><img src="assets/caras/feliz.svg" alt="" width="60" height="48"></button>
        <span class="sello sello-no" aria-hidden="true">${ICON.repetir}${t('repasar')}</span>
        <span class="sello sello-si" aria-hidden="true">${ICON.check}${t('lo_se')}</span>
        <div class="tarjeta-acciones">
          <button class="btn btn-repasar" type="button"><span aria-hidden="true">←</span>${ICON.repetir}<span>${t('repasar')}</span></button>
          <button class="btn primario btn-sabe" type="button">${ICON.check}<span>${t('lo_se')}</span><span aria-hidden="true">→</span></button>
        </div>
        ${primera ? `<p class="hint-deslizar" aria-hidden="true">${t('desliza_lados')}</p>` : ''}
      </div>
    </article>`;
}

function slidesDeFeed() { return $$('#feed .slide:not(.fin)'); }

function actualizarCuenta() {
  const slides = slidesDeFeed();
  const hechas = slides.filter((s) => s.dataset.r).length;
  $('#feed-cuenta').textContent = `${hechas} / ${slides.length}`;
  $('#feed-barra').style.width = `${(hechas / slides.length) * 100}%`;
}

/** Sakura chica junto a la barra de la sesión: crece con cada palabra hasta la meta. */
function pintarFlor(crece = false) {
  const img = $('#feed-flor');
  if (!img) return;
  img.src = srcFlor(etapaHoy());
  img.title = t('meta_progreso', { n: Math.min(hoyRevisadas(), S.ajustes.meta), m: S.ajustes.meta });
  img.setAttribute('aria-label', img.title);
  if (crece) { img.classList.remove('crece'); void img.offsetWidth; img.classList.add('crece'); }
}

function responderSlide(slide, sabia, auto = false) {
  if (!sesion || slide.dataset.r) return;
  const { meta } = sesion;
  const id = slide.dataset.id;
  slide.dataset.r = sabia ? 'si' : 'no';
  if (!auto) (sesion.respondidas ??= []).push({ id, sabia });
  const diaAntes = S.racha.ultimoDia;
  const nivAntes = dificultad(store.progresoDe(S, meta)[id]);
  sesion.tokens += (sesion.libre ? store.registrarPractica : store.registrarRespuesta)(S, meta, id, sabia);
  if (S.tutorialVisto && store.esNovato(S)) { if (!sabia) pista('kitty', 'tut_k4'); else pista('monedas', 'tut_k3'); }
  sabia ? sesion.sabias++ : sesion.repasar++;
  if (!auto) {
    sonido.moneda(0.05, sabia ? 2 : 0);
    volarMonedas(slide, sabia ? 3 : 1);
    const etapa = etapaHoy();
    const premio = store.contarRevision(S);
    if (premio) { sesion.tokens += premio.monedas; setTimeout(() => mostrarPremio(premio), 700); }
    if (etapaHoy() !== etapa) pintarFlor(true);
    regarJardin(J.CRECE_POR_PALABRA);
    if (S.diario.revisadas === S.ajustes.meta) regarJardin(J.CRECE_POR_META);
    if (S.diario.revisadas === store.DIAMANTE_PALABRAS) setTimeout(() => celebrarDiamante(t('dia_50')), premio ? 1600 : 600);
    else if (!window.__sinSorpresas && !store.esNovato(S) && store.tocaDiamante(S)) setTimeout(aparecerDiamante, 900 + Math.random() * 2500);
    if (S.racha.ultimoDia !== diaAntes) setTimeout(celebrarRacha, premio ? 1200 : 500);
  }
  const niv = dificultad(store.progresoDe(S, meta)[id]);
  $('.nivel', slide).outerHTML = insignia(niv);
  if (!auto && niv === 'dominada' && nivAntes !== 'dominada') {
    S.tokens += store.BONO_DOMINADA; sesion.tokens += store.BONO_DOMINADA;
    setTimeout(() => mostrarDominada(id, meta), 500);
  }
  if (!auto) flotar(slide, '+1');

  if (!sabia) {
    sesion.reps[id] = (sesion.reps[id] ?? 0) + 1;
    // "Repasar" vuelve hasta 2 veces (las saltadas se marcan al terminar y ya no vuelven).
    if (!sesion.terminada && sesion.reps[id] <= MAX_REPETICIONES) {
      const slides = slidesDeFeed();
      const pos = Math.max(slides.indexOf(slide) + REINSERTAR_EN, sesion.actual + 1);
      const tmp = document.createElement('div');
      tmp.innerHTML = htmlSlide(id);
      const nueva = tmp.firstElementChild;
      (slides[pos] ?? $('#slide-fin')).before(nueva);
      sesion.observer.observe(nueva);
    }
  }
  guardar();
  actualizarChips();
  actualizarCuenta();
  if (!auto) setTimeout(() => irA(1), 380);
}

function irA(delta) {
  if (!sesion) return; // se salió de la sesión antes de que avanzara
  const todas = $$('#feed .slide');
  const destino = todas[Math.min(Math.max(sesion.actual + delta, 0), todas.length - 1)];
  destino?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}

function alVerSlide(entries) {
  if (!sesion) return;
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const todas = $$('#feed .slide');
    const i = todas.indexOf(e.target);
    sesion.actual = i;
    todas.forEach((s) => s.classList.toggle('activa', s === e.target)); // la tarjeta a la vista se agranda y aclara
    // Pasar una tarjeta sin marcar cuenta como "repasar", pero recién al terminar:
    // así se puede volver atrás con el scroll y responderla.
    if (e.target.id === 'slide-fin') terminar();
  }
}

function terminar() {
  if (!sesion || sesion.terminada) return;
  sesion.terminada = true;
  slidesDeFeed().forEach((sl) => { if (!sl.dataset.r) responderSlide(sl, false, true); });
  sesion.tokens += store.terminarSesion(S);
  sonido.fin();
  guardar();
  contarSesion(); // medición anónima
  actualizarChips();
  const racha = store.rachaVigente(S.racha);
  $('#slide-fin').innerHTML = `
    <div class="tarjeta fin-card">
      <div class="lluvia" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<img src="assets/sakura.svg" alt="" width="23" height="23" style="--i:${i}">`).join('')}</div>
      <img class="cara-grande" src="${cara(sesion.sabias >= sesion.repasar ? 'celebrando' : 'muy_feliz')}" alt="" width="80" height="64">
      <h2 class="display">${t('fin_titulo')}</h2>
      <dl class="stats">
        <div><dt>${t('fin_sabias')}</dt><dd>${sesion.sabias}</dd></div>
        <div><dt>${t('fin_repasar')}</dt><dd>${sesion.repasar}</dd></div>
        <div><dt>${t('fin_tokens')}</dt><dd>+${sesion.tokens}</dd></div>
      </dl>
      <p class="racha-fin"><img src="assets/sakura.svg" alt="" width="46" height="46">${tn('racha_n', racha)}</p>
      <div class="acciones">
        ${puedePrueba() ? `<button class="btn primario" type="button" id="btn-prueba">🧠 ${t('prueba_empezar')}</button>` : ''}
        <button class="btn ${puedePrueba() ? '' : 'primario'}" type="button" id="btn-otra">${t('otra_sesion')}</button>
        <a class="btn" href="${sesion.volverA}">${t('cambiar_tema')}</a>
      </div>
    </div>`;
  $('#btn-otra').addEventListener('click', () => router());
  $('#btn-prueba')?.addEventListener('click', abrirPrueba);
}

// ---------- Prueba de Kitty: escribir qué significa (recuerdo activo, opcional) ----------
const puedePrueba = () => (sesion?.respondidas?.length ?? 0) >= 3;
function abrirPrueba() {
  const { meta, nativo } = sesion;
  const ids = prueba.elegir(sesion.respondidas, 3);
  let i = 0, aciertos = 0, monedas = 0;
  const caraK = (c) => `<img class="prueba-kitty" src="${cara(c)}" alt="" width="60" height="48">`;
  const pintar = () => {
    const id = ids[i];
    const ej = banco.ejemplo(meta, id);
    $('#modal-cuerpo').innerHTML = `
      <form class="prueba" id="prueba-form" autocomplete="off">
        <p class="suave prueba-paso">${t('prueba_paso', { i: i + 1, n: ids.length })}</p>
        <p class="prueba-palabra" lang="${meta}">${esc(banco.texto(meta, id).texto)}</p>
        ${ej ? `<p class="prueba-ejemplo" lang="${meta}">${marcar(ej.ejemplo)}</p>` : ''}
        <label class="campo"><span>${t('prueba_pregunta', { idioma: nombreIdioma(nativo) })}</span>
          <input id="prueba-resp" name="r" lang="${nativo}" autocapitalize="off" spellcheck="false" required></label>
        <div class="prueba-feedback" id="prueba-fb" aria-live="polite"></div>
        <div class="acciones">
          <button class="btn primario" type="submit" id="prueba-ok">${t('prueba_comprobar')}</button>
          <button class="btn fantasma" type="button" id="prueba-saltar">${t('prueba_saltar')}</button>
        </div>
      </form>`;
    $('#prueba-resp').focus();
    $('#prueba-saltar').addEventListener('click', () => $('#modal').close());
    $('#prueba-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const correcta = banco.texto(nativo, id).texto;
      const bien = prueba.esCorrecta($('#prueba-resp').value, correcta);
      monedas += store.resultadoPrueba(S, meta, id, bien);
      if (bien) { aciertos++; sonido.premio(); } else sonido.quitar();
      guardar(); actualizarChips();
      $('#prueba-resp').readOnly = true;
      $('#prueba-fb').className = `prueba-feedback ${bien ? 'bien' : 'mal'}`;
      $('#prueba-fb').innerHTML = `${caraK(bien ? 'celebrando' : 'confundida')}
        <p><strong lang="${meta}">${esc(prueba.KITTY_DICE[bien ? 'si' : 'no'][meta] ?? '')}</strong>
        ${bien ? `<span>+${store.TOKENS_POR_PRUEBA} 🪙</span>` : `<span>${t('prueba_era')} <b lang="${nativo}">${esc(correcta)}</b></span>`}</p>`;
      const ultimo = i === ids.length - 1;
      $('.prueba .acciones').innerHTML = `<button class="btn primario" type="button" id="prueba-sig">${t(ultimo ? 'prueba_ver' : 'prueba_siguiente')}</button>`;
      $('#prueba-sig').focus();
      $('#prueba-sig').addEventListener('click', () => { if (ultimo) final(); else { i++; pintar(); } });
    });
  };
  const final = () => {
    const todo = aciertos === ids.length;
    $('#modal-cuerpo').innerHTML = `
      <div class="prueba prueba-final">
        ${caraK(todo ? 'enamorada' : aciertos ? 'feliz' : 'guino')}
        <p class="prueba-palabra">${t('prueba_resultado', { a: aciertos, n: ids.length })}</p>
        <p class="suave">${t(todo ? 'prueba_todo' : aciertos ? 'prueba_algo' : 'prueba_nada')}</p>
        ${monedas ? `<p>+${monedas} 🪙</p>` : ''}
      </div>`;
    if (todo) lluvia({ cantidad: 18 });
  };
  modal(t('prueba_titulo'), '');
  pintar();
}

function flotar(slide, texto) {
  const el = document.createElement('span');
  el.className = 'flotante';
  el.innerHTML = `<img src="assets/moneda.svg" alt="" width="24" height="24">${texto}`;
  el.setAttribute('aria-hidden', 'true');
  $('.tarjeta', slide).append(el);
  setTimeout(() => el.remove(), 900);
}

/** Responde con animación: la tarjeta sale volando a la derecha (Lo sé) o a la izquierda (Repasar). */
function lanzarTarjeta(slide, sabia) {
  if (!sesion || slide.dataset.r) return;
  const tarj = $('.tarjeta', slide);
  sonido.deslizar(sabia);
  if (!sinMovimiento()) {
    tarj.classList.add('volando');
    tarj.style.setProperty('--sw', sabia ? 1 : -1);
    tarj.style.transform = `translateX(${sabia ? 125 : -125}vw) rotate(${sabia ? 22 : -22}deg)`;
    setTimeout(() => { tarj.classList.remove('volando', 'arrastrando'); tarj.style.transform = ''; tarj.style.removeProperty('--sw'); }, 1100);
  }
  responderSlide(slide, sabia);
}

/** Deslizar la tarjeta con el dedo o el mouse: → Lo sé, ← Repasar. El scroll vertical sigue pasando tarjetas. */
let ignorarClick = false;
function activarDeslizar(feed) {
  let d = null;
  const UMBRAL = 90;
  feed.addEventListener('pointerdown', (e) => {
    const tarj = e.target.closest('.tarjeta');
    if (!tarj || e.button > 0 || e.target.closest('.riel, .kitty-ayuda, .tarjeta-acciones, a')) return;
    const slide = tarj.closest('.slide');
    if (!slide || slide.classList.contains('fin') || slide.dataset.r) return;
    d = { tarj, slide, x0: e.clientX, y0: e.clientY, dx: 0, activo: false, id: e.pointerId };
  });
  feed.addEventListener('pointermove', (e) => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.activo) {
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        d.activo = true;
        d.tarj.setPointerCapture?.(d.id);
        d.tarj.classList.add('arrastrando');
      } else if (Math.abs(dy) > 12) { d = null; return; } else return;
    }
    d.dx = dx;
    d.tarj.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
    d.tarj.style.setProperty('--sw', Math.max(-1, Math.min(1, dx / UMBRAL)).toFixed(2));
  });
  const soltar = () => {
    if (!d) return;
    const { tarj, slide, dx, activo } = d;
    d = null;
    if (!activo) return;
    ignorarClick = true;
    setTimeout(() => { ignorarClick = false; }, 60);
    if (Math.abs(dx) >= UMBRAL) lanzarTarjeta(slide, dx > 0);
    else {
      tarj.classList.remove('arrastrando');
      tarj.style.transform = '';
      tarj.style.removeProperty('--sw');
    }
  };
  feed.addEventListener('pointerup', soltar);
  feed.addEventListener('pointercancel', soltar);
}

// ---------- Tutorial guiado por Kitty (en la primera sesión) ----------
let tutorialAlRevelar = null;  // el tutorial avanza cuando se revela la primera tarjeta
const PASOS_TUT = [
  { texto: 'tut_k1', cara: 'muy_feliz', objetivo: (sl) => sl && $('.revelar', sl) },
  { texto: 'tut_k2', cara: 'guino', objetivo: (sl) => sl && $('.tarjeta', sl) },
];
// Lo demás se cuenta cuando pasa (no todo de golpe al principio)
function pista(clave, texto) {
  if (S.pistas[clave]) return;
  S.pistas[clave] = true; guardar();
  setTimeout(() => toast(t(texto)), 700);
}
function ocultarTutorial() {
  const capa = $('#tutorial');
  if (capa) { capa.hidden = true; capa.innerHTML = ''; }
  $$('.tut-foco').forEach((e) => e.classList.remove('tut-foco'));
  tutorialAlRevelar = null;
}
function iniciarTutorial() {
  if (!sesion || S.tutorialVisto) return;
  const capa = $('#tutorial');
  let i = 0;
  const terminar = () => { ocultarTutorial(); S.tutorialVisto = true; guardar(); };
  const avanzar = () => { i += 1; if (i >= PASOS_TUT.length) terminar(); else pintar(); };
  const pintar = () => {
    const paso = PASOS_TUT[i];
    const slide = $$('#feed .slide')[sesion?.actual ?? 0];
    $$('.tut-foco').forEach((e) => e.classList.remove('tut-foco'));
    paso.objetivo(slide)?.classList.add('tut-foco');
    const ultimo = i === PASOS_TUT.length - 1;
    capa.innerHTML = `
      <div class="tut-burbuja" role="dialog" aria-label="Kitty" aria-live="polite">
        <img src="${cara(paso.cara)}" alt="" width="60" height="48">
        <div class="tut-cuerpo">
          <p>${t(paso.texto)}</p>
          <div class="tut-acciones">
            <span class="tut-pasos" aria-hidden="true">${PASOS_TUT.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>
            ${ultimo ? '' : `<button class="btn pequeno" type="button" id="tut-saltar">${t('tut_saltar')}</button>`}
            <button class="btn primario pequeno" type="button" id="tut-avanzar">${t(ultimo ? 'tut_listo' : 'tut_siguiente')}</button>
          </div>
        </div>
      </div>`;
    capa.hidden = false;
    $('#tut-avanzar').addEventListener('click', avanzar);
    $('#tut-saltar')?.addEventListener('click', terminar);
  };
  tutorialAlRevelar = () => { if (i === 0) avanzar(); };
  pintar();
}

function clickFeed(e) {
  if (ignorarClick) return;
  const slide = e.target.closest('.slide');
  if (!slide || slide.classList.contains('fin')) return;
  const id = slide.dataset.id;
  if (e.target.closest('.revelar')) {
    const b = e.target.closest('.revelar');
    b.setAttribute('aria-expanded', 'true');
    $('.traduccion', b).removeAttribute('aria-hidden');
    $('.ejemplo', slide)?.removeAttribute('aria-hidden');
    if (!slide.classList.contains('revelada')) sonido.voltear();
    slide.classList.add('revelada');
    tutorialAlRevelar?.();
  } else if (e.target.closest('.btn-sabe')) lanzarTarjeta(slide, true);
  else if (e.target.closest('.btn-repasar')) lanzarTarjeta(slide, false);
  else if (e.target.closest('.ej-audio')) {
    const ej = banco.ejemplo(sesion.meta, id);
    if (ej && !hablar(ej.ejemplo.replace(/\*/g, ''), sesion.meta)) toast(t('sin_voz'));
  } else if (e.target.closest('.btn-audio')) {
    if (!hablar(banco.texto(sesion.meta, id).texto, sesion.meta)) toast(t('sin_voz'));
  } else if (e.target.closest('.kitty-ayuda')) kittyAbrir();
  else if (e.target.closest('.btn-fav')) alternarFav(slide, id, e.target.closest('.btn-fav'));
}

/** Marca o quita favorito y actualiza el corazón de la tarjeta. forzar=true solo marca (doble toque). */
function alternarFav(slide, id, origen, forzar = false) {
  if (forzar && store.esFavorito(S, sesion.meta, id)) return true;
  const on = store.alternarFavorito(S, sesion.meta, id);
  guardar();
  if (on) { sonido.like(); estallarCorazones(origen ?? $('.btn-fav', slide)); } else sonido.quitar();
  $$(`#feed .slide[data-id="${id}"] .btn-fav`).forEach((b) => {
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', t(on ? 'quitar_favorito' : 'favorito'));
    b.innerHTML = on ? ICON.corazonLleno : ICON.corazon;
    b.classList.toggle('pop', on);
  });
  return on;
}

let ultimoToque = null;
/** Dos toques seguidos (< 320 ms, cerca) en la misma tarjeta; funciona igual con dedo y mouse. */
function detectarDobleToque(e) {
  if (ignorarClick) return;
  const ahora = performance.now();
  const u = ultimoToque;
  ultimoToque = { t: ahora, x: e.clientX, y: e.clientY, tarj: e.target.closest('.tarjeta') };
  if (u && u.tarj && u.tarj === ultimoToque.tarj && ahora - u.t < 320 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 40) {
    ultimoToque = null;
    dobleToqueFeed(e);
  }
}

/** Doble toque en la tarjeta = favorito, con un corazón grande que salta donde tocaste (como Instagram). */
function dobleToqueFeed(e) {
  const tarj = e.target.closest('.tarjeta');
  if (!tarj || e.target.closest('button:not(.revelar), a, details, .riel, .tarjeta-acciones')) return;
  const slide = tarj.closest('.slide');
  if (!slide || slide.classList.contains('fin')) return;
  e.preventDefault();
  window.getSelection?.()?.removeAllRanges();
  alternarFav(slide, slide.dataset.id, null, true);
  if (sinMovimiento()) return;
  const r = tarj.getBoundingClientRect();
  const h = document.createElement('span');
  h.className = 'corazon-grande'; h.setAttribute('aria-hidden', 'true'); h.innerHTML = ICON.corazonLleno;
  h.style.left = `${e.clientX - r.left}px`; h.style.top = `${e.clientY - r.top}px`;
  tarj.append(h);
  setTimeout(() => h.remove(), 900);
}

document.addEventListener('keydown', (e) => {
  if (!sesion || e.target.closest('input, textarea, select, dialog') || e.metaKey || e.ctrlKey) return;
  const slide = $$('#feed .slide')[sesion.actual];
  const accion = { ArrowDown: () => irA(1), j: () => irA(1), ArrowUp: () => irA(-1), k: () => irA(-1),
    1: () => slide && $('.btn-repasar', slide)?.click(), 2: () => slide && $('.btn-sabe', slide)?.click(),
    ArrowLeft: () => slide && $('.btn-repasar', slide)?.click(), ArrowRight: () => slide && $('.btn-sabe', slide)?.click(),
    ' ': () => slide && $('.revelar', slide)?.click(), f: () => slide && $('.btn-fav', slide)?.click(),
    p: () => slide && $('.btn-audio', slide)?.click() }[e.key];
  if (accion) { e.preventDefault(); accion(); }
});
