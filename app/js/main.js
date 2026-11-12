// Polykat — arranque y rutas con # (funciona en cualquier hosting estático, p. ej. GitHub Pages).
// Cada pantalla vive en js/pantallas/; lo que comparten, en ui.js, estado.js y marco.js.
import { traspasado } from './traspaso.js'; // primero: puede traer el avance desde la dirección antigua
import * as prueba from './prueba.js';
import { t, tn, cargarIdiomaUI, tMega, tTipo, nombreIdioma, IDIOMAS_UI, MEGA_TEMAS } from './i18n.js';
import * as store from './store.js';
import { PALETAS } from './store.js';
import { dificultad } from './srs.js';
import { armarSesion, practicaLibre, filtrarLibre, ordenar, grupoDificultad, REINSERTAR_EN, MAX_REPETICIONES } from './sesion.js';
import * as banco from './banco.js';
import { hablar } from './voz.js';
import { ICON } from './iconos.js';
import { sonido, activarSonido } from './sonido.js';
import { musica } from './musica.js';
import { sembrarAdornos, sembrarVisitantes, estallido, lluvia } from './adornos.js';
import * as nube from './nube.js';
import * as J from './jardin.js';
import * as rec from './recordatorio.js';
import { $, $$, esc, vista, cara, toast, modal, registrarRouter, htmlCargando, htmlVacio, cargando, marcar, sinMovimiento, estallarCorazones } from './ui.js';
import { S, setS, sesion, setSesion, guardar, guardarYa, conCuenta, filaRanking, publicarMiRanking, conectarGoogle, salirDeGoogle, sincronizarAlAbrir, aplicarAjustes, nativoInicial } from './estado.js';
import { kittyAbrir } from './kitty-chat.js';
import { actualizarChips, pintarMarco, ultimaVersion, setUltimaVersion, marcarAvisoNovedades, cambiarNativo, insignia, EMOJI_MEGA, hoyRevisadas, etapaHoy, srcFlor } from './marco.js';
import { instalada, avisoDescarga, iconoApp, botonInstalar } from './instalacion.js';
import { celebrarRacha, volarMonedas, mostrarDominada, aparecerDiamante, celebrarDiamante, mostrarPremio } from './celebraciones.js';
import { vistaInicio, vistaConservar } from './pantallas/inicio.js';
import { vistaIdiomas } from './pantallas/idiomas.js';
import { vistaAprender, vistaTema } from './pantallas/aprender.js';
import { vistaPalabra } from './pantallas/palabra.js';
import { regarJardin, vistaJardin } from './pantallas/pantalla-jardin.js';
import { vistaMenu } from './pantallas/menu.js';
import { vistaInstalar } from './pantallas/instalar.js';

let primeraCarga = true;
let tutorialAlRevelar = null;  // el tutorial avanza cuando se revela la primera tarjeta

function descargarCalendario() {
  const a = S.ajustes;
  const ics = rec.crearICS({ hora: a.horaRecordatorio, titulo: t('rec_evento'), descripcion: t('rec_noti_texto'), url: new URL('./', location.href).href });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  enlace.download = 'polykat-recordatorio.ics';
  document.body.append(enlace); enlace.click(); enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 4000);
}

// ---------- Router ----------
function leerRuta() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const partes = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { nombre: partes[0] || '', args: partes.slice(1), q: new URLSearchParams(qs || '') };
}

const RUTAS = {
  inicio: vistaInicio,
  menu: vistaMenu,
  instalar: vistaInstalar,
  jardin: vistaJardin,
  buzon: vistaBuzon,
  libre: vistaLibre,
  conservar: vistaConservar,
  idiomas: vistaIdiomas,
  aprender: vistaAprender,
  tema: vistaTema,
  estudiar: vistaEstudiar,
  favoritos: vistaFavoritos,
  ranking: vistaRanking,
  novedades: vistaNovedades,
  palabra: vistaPalabra,
  ajustes: vistaAjustes,
};

async function router() {
  const r = leerRuta();
  if (!S.perfil.elegido && !['inicio', 'conservar', 'instalar'].includes(r.nombre)) return void location.replace('#/inicio');
  if (!RUTAS[r.nombre]) return void location.replace('#/menu');
  cerrarSesion();
  document.body.dataset.ruta = r.nombre;
  pintarMarco(r.nombre);
  await RUTAS[r.nombre](r);
  avisoDescarga(r.nombre);
  if (!primeraCarga) vista.focus({ preventScroll: true });
  primeraCarga = false;
  if (r.nombre !== 'estudiar') scrollTo(0, 0);
}
addEventListener('hashchange', router);
registrarRouter(router); // para que los demás módulos puedan volver a dibujar la vista
sembrarAdornos($('#adornos'), { cantidad: 10 });
sembrarVisitantes($('#adornos'), { nubes: 2, abejas: 1 });
// Estallido de sakuras y monedas al elegir un tema o un idioma
document.addEventListener('click', (e) => {
  if (e.target.closest('.neurona:not(.vacio), .nodo-idioma:not([aria-disabled="true"])')) estallido(e.clientX, e.clientY);
});

fetch('data/novedades.json').then((r) => r.json()).then((d) => { setUltimaVersion(d.novedades[0]?.version ?? null); marcarAvisoNovedades(); }).catch(() => {});
// Clic suave en botones y enlaces (los sonidos especiales se suman encima)
// La música (si está encendida) parte con el primer toque: los navegadores no dejan sonar antes.
document.addEventListener('pointerdown', () => { if (S.ajustes.musica) musica(true); }, { once: true, passive: true });
document.addEventListener('pointerdown', (e) => { if (e.target.closest('button, a, [role="radio"], input[type="checkbox"], select')) sonido.toque(); }, { passive: true });

// ---------- Estudiar: feed de tarjetas que se deslizan ----------
function cerrarSesion() {
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

async function vistaEstudiar(r) {
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

// ---------- Favoritos (separados por idioma) ----------
async function vistaFavoritos(r) {
  const nativo = S.ajustes.nativo;
  const conFavs = Object.keys(S.favoritos).filter((l) => l !== nativo && (S.favoritos[l] ?? []).length);
  const pedido = r?.q?.get('l');
  const meta = conFavs.includes(pedido) ? pedido : conFavs.includes(S.aprendiendo) ? S.aprendiendo : conFavs[0];
  if (!meta) {
    vista.innerHTML = `
      <section class="pagina angosta">
        <h1 class="display">${t('fav_titulo')}</h1>
        <div class="vacio-estado centro"><img class="cara-grande" src="${cara('enamorada')}" alt="" width="80" height="64"><p class="suave">${t('fav_vacio')}</p></div>
      </section>`;
    return;
  }
  cargando();
  await banco.prepararPar(meta, nativo);
  const ids = (S.favoritos[meta] ?? []).filter((id) => banco.texto(meta, id) && banco.texto(nativo, id));
  const prog = store.progresoDe(S, meta);
  const pestanas = conFavs.map((l) => `<a class="pestana-idioma" href="#/favoritos?l=${l}" ${l === meta ? 'aria-current="page"' : ''}>
      <span class="monograma pequeno" aria-hidden="true">${l.toUpperCase()}</span><span lang="${l}">${esc(nombreIdioma(l))}</span><small>${S.favoritos[l].length}</small></a>`).join('');
  const filas = ids.map((id) => `<li class="fila-fav" data-id="${id}">
        <button class="icon-btn btn-audio" type="button" aria-label="${t('escuchar')}">${ICON.audio}</button>
        <div><strong lang="${meta}">${esc(banco.texto(meta, id).texto)}</strong><span lang="${nativo}">${esc(banco.texto(nativo, id).texto)}</span></div>
        ${insignia(dificultad(prog[id]))}
        <button class="icon-btn btn-quitar" type="button" aria-label="${t('quitar_favorito')}">${ICON.corazonLleno}</button>
      </li>`).join('');
  vista.innerHTML = `
    <section class="pagina angosta">
      <h1 class="display">${t('fav_titulo')}</h1>
      <nav class="pestanas-idioma" aria-label="${t('fav_titulo')}">${pestanas}</nav>
      <button class="btn primario" type="button" id="btn-fav-estudiar">${t('fav_estudiar')}</button>
      <ul class="lista-fav">${filas}</ul>
    </section>`;
  $('#btn-fav-estudiar').addEventListener('click', () => { S.aprendiendo = meta; guardar(); location.hash = '#/estudiar?fav=1'; });
  $$('.fila-fav').forEach((li) => {
    $('.btn-audio', li).addEventListener('click', () => { if (!hablar(banco.texto(meta, li.dataset.id).texto, meta)) toast(t('sin_voz')); });
    $('.btn-quitar', li).addEventListener('click', () => {
      store.alternarFavorito(S, meta, li.dataset.id); guardar();
      vistaFavoritos({ q: new URLSearchParams({ l: meta }) });
    });
  });
}

// ---------- Ranking ----------
let campoRanking = 'racha';
const IMG_LIGA = ['flor-0', 'flor-1', 'flor-3', 'sakura'];
/** Tarjeta de la liga semanal: insignia, XP de la semana, cuánto falta para subir y cuándo cierra. */
function cabeceraLiga() {
  store.actualizarLiga(S);
  const l = S.liga, max = l.nivel === store.LIGAS.length - 1;
  const dias = store.diasParaCierre();
  const pct = Math.min(100, (l.xp / store.SUBE_LIGA) * 100);
  const peldanos = store.LIGAS.map((n, i) => `<li class="${i === l.nivel ? 'actual' : i < l.nivel ? 'pasada' : ''}"><img src="assets/${IMG_LIGA[i]}.svg" alt="" width="46" height="46"><span>${t('liga_' + n)}</span></li>`).join('');
  return `<div class="card liga-card">
      <ol class="liga-peldanos" aria-label="${t('rank_xp')}">${peldanos}</ol>
      <h2>${t('liga_' + store.LIGAS[l.nivel])}</h2>
      <p class="liga-xp"><strong>${t('liga_xp', { n: l.xp })}</strong> · ${dias === 1 ? t('liga_dias_1') : t('liga_dias_n', { n: dias })}</p>
      <span class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${store.SUBE_LIGA}" aria-valuenow="${Math.min(l.xp, store.SUBE_LIGA)}" aria-label="${t('liga_xp', { n: l.xp })}"><i style="width:${pct}%"></i></span>
      <small>${max ? t('liga_max', { n: store.BAJA_LIGA }) : t('liga_meta', { n: store.SUBE_LIGA })}</small>
      <p class="suave pequeno">${t("liga_como")}</p>
    </div>`;
}

async function vistaRanking() {
  const campo = campoRanking;
  const yo = filaRanking();
  const uid = S.perfil.cuenta?.uid;
  const ayer = store.diaLocal(Date.now() - 864e5);
  // La racha guardada se «vence» si esa persona no estudió ni hoy ni ayer
  const valor = (f) => (campo === 'racha' ? (f.dia && f.dia >= ayer ? f.racha : 0) : f[campo] ?? 0);
  const icono = { racha: '<img src="assets/sakura.svg" alt="" width="23" height="23">', palabras: ICON.libro, nivel: ICON.arbol, xp: ICON.estrella }[campo];
  const sem = store.semanaISO();
  const deMiLiga = (f) => campo !== 'xp' || (f.semana === sem && (f.liga ?? 0) === S.liga.nivel);
  const fila = (f, puesto) => `
    <li class="${f.uid && f.uid === uid ? 'yo' : ''}"><span class="puesto">${puesto}</span>
      <span class="avatar">${esc((f.nombre || '?').charAt(0).toUpperCase())}</span>
      <strong>${esc(f.nombre || '?')}${f.uid === uid ? ` <small>(${t('rank_tu')})</small>` : ''}</strong>
      <span class="chip">${icono}<span>${campo === 'nivel' ? t('jar_nivel', { n: valor(f) }) : campo === 'xp' ? `${valor(f)} XP` : valor(f)}</span></span></li>`;
  const tabs = nube.CAMPOS_RANKING.map((c) => `<button role="tab" type="button" data-campo="${c}" aria-selected="${c === campo}">${t(c === 'racha' ? 'rank_t_racha' : 'rank_' + c)}</button>`).join('');
  const marco = (contenido) => {
    vista.innerHTML = `
      <section class="pagina angosta">
        <h1 class="display">${t('rank_titulo')}</h1>
        <div class="seg ranking-tabs" role="tablist">${tabs}</div>
        ${campo === 'xp' ? cabeceraLiga() : ''}
        ${contenido}
      </section>`;
    $$('[data-campo]').forEach((b) => b.addEventListener('click', () => { campoRanking = b.dataset.campo; vistaRanking(); }));
  };
  if (!conCuenta()) {
    marco(`<ol class="ranking">${fila({ ...yo, nombre: S.perfil.nombre || t('rank_tu'), uid: 'yo' }, 1).replace('class=""', 'class="yo"')}</ol>
      <p class="aviso">${t(nube.nubeLista() ? 'rank_entra' : 'rank_pronto')}</p>
      ${nube.nubeLista() ? `<button class="btn primario ancho" type="button" id="rank-google">${ICON.google}<span>${t('login_google')}</span></button>` : ''}`);
    $('#rank-google')?.addEventListener('click', conectarGoogle);
    return;
  }
  marco(htmlCargando());
  try {
    if (S.ajustes.ranking !== false) await nube.publicarRanking(uid, yo);
    let filas = (await nube.leerRanking(campo)).filter(deMiLiga);
    if (campoRanking !== campo) return; // cambió de pestaña mientras cargaba
    if (S.ajustes.ranking !== false && !filas.some((f) => f.uid === uid)) filas.push({ ...yo, uid });
    filas = filas.map((f) => (f.uid === uid ? { ...f, ...yo, uid } : f)).sort((x, y) => valor(y) - valor(x));
    const mio = filas.findIndex((f) => f.uid === uid);
    marco(`
      <ol class="ranking">${filas.map((f, i) => fila(f, i + 1)).join('')}</ol>
      ${filas.length <= 1 ? htmlVacio(t(campo === 'xp' ? 'liga_solo' : 'rank_vacio'), campo === 'xp' ? 'guino' : 'pensando', 'aviso') : ''}
      ${S.ajustes.ranking === false ? `<p class="aviso">${t('rank_oculto')}</p>` : mio >= 0 ? `<p class="suave centro">${t('rank_puesto', { n: mio + 1 })}</p>` : ''}`);
  } catch {
    marco(`<ol class="ranking">${fila({ ...yo, uid }, 1)}</ol><p class="aviso">${t('rank_error')}</p>`);
  }
}

// ---------- Estudio libre: elegir qué repasar sin mover el calendario ----------
const libreFiltro = { texto: '', mega: '', nivel: 'vistas', elegidos: new Set() };
const MAX_LIBRE_LISTA = 120, MAX_LIBRE_SESION = 40;
async function vistaLibre() {
  if (!S.aprendiendo) return void (location.hash = '#/idiomas');
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  cargando();
  await banco.prepararPar(meta, nativo);
  const prog = store.progresoDe(S, meta);
  const todos = ordenar(banco.disponibles(meta, nativo));
  const nivelDe = (id) => dificultad(prog[id]);
  const textos = (id) => [banco.texto(meta, id)?.texto ?? '', banco.texto(nativo, id)?.texto ?? ''];
  const f = libreFiltro;
  const chips = [['vistas', t('libre_f_vistas')], ['dominada', t('niv_dominada')], ['facil', t('niv_facil')], ['media', t('niv_media')], ['dificil', t('niv_dificil')], ['favoritos', t('libre_f_favoritos')], ['todas', t('libre_f_todas')]];
  vista.innerHTML = `
    <section class="pagina angosta libre">
      <h1 class="display">${t('libre_titulo')}</h1>
      <p class="suave">${t('libre_texto')}</p>
      <label class="campo"><span>${t('libre_buscar')}</span><input type="search" id="libre-q" value="${esc(f.texto)}" autocomplete="off" enterkeyhint="search"></label>
      <label class="campo"><span>${t('libre_tema')}</span><select id="libre-tema"><option value="">${t('libre_todos_temas')}</option>${MEGA_TEMAS.map((m) => `<option value="${esc(m)}" ${m === f.mega ? 'selected' : ''}>${esc(tMega(m))}</option>`).join('')}</select></label>
      <div class="libre-chips" role="radiogroup" aria-label="${t('libre_titulo')}">${chips.map(([v, l]) => `<button type="button" role="radio" data-nivel="${v}" aria-checked="${f.nivel === v}">${l}</button>`).join('')}</div>
      <div class="libre-barra"><span id="libre-cuenta"></span><button class="btn pequeno" type="button" id="libre-marcar"></button></div>
      <ul class="libre-lista" id="libre-lista"></ul>
      <p class="suave pequeno" id="libre-mas"></p>
      <div class="libre-acciones">
        <button class="btn" type="button" id="libre-azar">${t('libre_azar')}</button>
        <button class="btn primario grande" type="button" id="libre-ir"></button>
      </div>
    </section>`;
  let visibles = [];
  const pintar = () => {
    visibles = filtrarLibre(todos, { ...f, favoritos: new Set(S.favoritos[meta] ?? []) }, { nivelDe, textos });
    const mostrar = visibles.slice(0, MAX_LIBRE_LISTA);
    $('#libre-cuenta').textContent = tn('libre_n', visibles.length);
    $('#libre-lista').innerHTML = mostrar.length ? mostrar.map((c) => `
      <li><label class="libre-fila"><input type="checkbox" value="${c.id}" ${f.elegidos.has(c.id) ? 'checked' : ''}>
        <span class="libre-palabra"><strong lang="${meta}">${esc(banco.texto(meta, c.id).texto)}</strong><small lang="${nativo}">${esc(banco.texto(nativo, c.id).texto)}</small></span>
        ${insignia(nivelDe(c.id))}</label></li>`).join('') : `<li>${htmlVacio(t('libre_vacio'), 'confundida')}</li>`;
    $('#libre-mas').textContent = visibles.length > MAX_LIBRE_LISTA ? t('libre_mas', { n: MAX_LIBRE_LISTA, m: visibles.length }) : '';
    $$('#libre-lista input').forEach((i) => i.addEventListener('change', () => { i.checked ? f.elegidos.add(i.value) : f.elegidos.delete(i.value); botones(); }));
    botones();
  };
  const botones = () => {
    const n = Math.min(f.elegidos.size, MAX_LIBRE_SESION);
    $('#libre-ir').disabled = !n;
    $('#libre-ir').textContent = t('libre_estudiar', { n });
    $('#libre-marcar').textContent = f.elegidos.size ? t('libre_desmarcar') : t('libre_marcar');
  };
  const ir = (ids) => { location.hash = `#/estudiar?${new URLSearchParams({ ids: ids.slice(0, MAX_LIBRE_SESION).join(',') })}`; };
  $('#libre-q').addEventListener('input', (e) => { f.texto = e.target.value; pintar(); });
  $('#libre-tema').addEventListener('change', (e) => { f.mega = e.target.value; pintar(); });
  $$('.libre-chips [data-nivel]', vista).forEach((b) => b.addEventListener('click', () => {
    f.nivel = b.dataset.nivel; $$('.libre-chips [data-nivel]', vista).forEach((x) => x.setAttribute('aria-checked', String(x === b))); pintar();
  }));
  $('#libre-marcar').addEventListener('click', () => {
    if (f.elegidos.size) f.elegidos.clear(); else visibles.slice(0, MAX_LIBRE_SESION).forEach((c) => f.elegidos.add(c.id));
    pintar();
  });
  $('#libre-ir').addEventListener('click', () => ir([...f.elegidos]));
  $('#libre-azar').addEventListener('click', () => {
    const base = visibles.length ? visibles : todos;
    ir([...base].sort(() => Math.random() - 0.5).slice(0, 10).map((c) => c.id));
  });
  pintar();
}

// ---------- Buzón de sugerencias ----------
const esCreadora = () => conCuenta() && S.perfil.cuenta.email?.toLowerCase() === nube.CREADORA;
let enviando = null;
/** Envía a la nube las sugerencias guardadas que aún no salieron. Devuelve cuántas se enviaron. */
function enviarSugerenciasPendientes() {
  if (enviando) return enviando;
  enviando = (async () => {
    if (!nube.nubeLista()) return 0;
    let n = 0;
    for (const s of S.sugerencias.filter((x) => !x.enviada)) {
      try {
        await nube.enviarSugerencia({ texto: s.texto, fecha: s.fecha, idioma: S.ajustes.nativo || '', version: ultimaVersion || '',
          ...(conCuenta() ? { uid: S.perfil.cuenta.uid, nombre: (S.perfil.nombre || '').slice(0, 30) } : {}) });
        s.enviada = true; n++;
      } catch { break; }
    }
    if (n) guardarYa();
    return n;
  })().finally(() => { enviando = null; });
  return enviando;
}
window.addEventListener('online', () => enviarSugerenciasPendientes());

function pintarLeida(li, b, leida) {
  li.classList.toggle('leida', leida); li.classList.toggle('nueva', !leida);
  b.textContent = t(leida ? 'buzon_no_leida' : 'buzon_leida');
  $('.buzon-meta .tag', li)?.toggleAttribute('hidden', leida);
}
/** Solo para la creadora: lee, marca y borra las sugerencias. */
async function vistaBuzon() {
  if (!esCreadora()) { location.hash = '#/ajustes'; return; }
  vista.innerHTML = `<section class="pagina angosta"><h1 class="display">${t('buzon_titulo')}</h1>${htmlCargando()}</section>`;
  let lista;
  try { lista = await nube.leerSugerencias(); } catch {
    vista.innerHTML = `<section class="pagina angosta"><h1 class="display">${t('buzon_titulo')}</h1><p class="aviso">${t('buzon_error')}</p></section>`; return;
  }
  const fecha = (ms) => new Date(ms).toLocaleString(S.ajustes.nativo || 'es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const sinLeer = lista.filter((x) => !x.leida).length;
  vista.innerHTML = `
    <section class="pagina angosta buzon">
      <h1 class="display">${t('buzon_titulo')}</h1>
      ${lista.length ? `<p class="suave">${tn('buzon_nuevas_n', sinLeer)}</p>` : htmlVacio(t('buzon_vacio'), 'con_sueno', 'aviso')}
      <ul class="buzon-lista">${lista.map((x) => `
        <li class="card ${x.leida ? 'leida' : 'nueva'}" data-id="${esc(x.id)}">
          <p class="buzon-meta"><span class="tag" ${x.leida ? 'hidden' : ''}>${t('niv_nueva')}</span><strong>${esc(x.nombre || t('buzon_anonimo'))}</strong>
            <span class="suave">· ${fecha(x.fecha)} · ${esc((x.idioma || '?').toUpperCase())}${x.version ? ` · v${esc(x.version)}` : ''}</span></p>
          <p class="buzon-texto">${esc(x.texto)}</p>
          <div class="buzon-acciones">
            <button class="btn pequeno" type="button" data-leer>${t(x.leida ? 'buzon_no_leida' : 'buzon_leida')}</button>
            <button class="btn fantasma pequeno" type="button" data-borrar>${t('buzon_borrar')}</button>
          </div>
        </li>`).join('')}</ul>
    </section>`;
  $$('.buzon-lista li').forEach((li) => {
    const x = lista.find((y) => y.id === li.dataset.id);
    // Se marca al instante en pantalla y se guarda en la nube; si la nube lo rechaza, se deshace y se dice por qué.
    $('[data-leer]', li).addEventListener('click', async (e) => {
      const b = e.currentTarget;
      const nueva = !x.leida;
      b.disabled = true;
      pintarLeida(li, b, nueva);
      try {
        await nube.marcarSugerencia(x.id, nueva);
        x.leida = nueva;
      } catch (err) {
        pintarLeida(li, b, x.leida);
        toast(err?.code === 'permission-denied' ? t('buzon_sin_permiso') : t('buzon_error'));
      }
      b.disabled = false;
      $('.buzon .suave').textContent = tn('buzon_nuevas_n', lista.filter((y) => !y.leida).length);
    });
    $('[data-borrar]', li).addEventListener('click', () => {
      modal(t('buzon_borrar'), `<p class="buzon-texto">${esc(x.texto)}</p><button class="btn peligro ancho" type="button" id="buzon-borrar-si">${t('buzon_borrar')}</button>`);
      $('#buzon-borrar-si').addEventListener('click', async () => {
        $('#modal').close();
        await nube.borrarSugerencia(x.id).then(() => toast(t('buzon_borrar_ok'))).catch(() => toast(t('buzon_error')));
        vistaBuzon();
      });
    });
  });
}

// ---------- Novedades ----------
async function vistaNovedades() {
  const data = await (await fetch('data/novedades.json')).json();
  const [ultima, ...resto] = data.novedades;
  const fecha = (f) => new Date(f + 'T12:00').toLocaleDateString(S.ajustes.nativo, { day: 'numeric', month: 'long', year: 'numeric' });
  setUltimaVersion(ultima.version);
  if (S.novedadVista !== ultima.version) { S.novedadVista = ultima.version; guardar(); }
  marcarAvisoNovedades();
  const confeti = [['sakura', 23, 23], ['estrella', 21, 21], ['moneda', 24, 24], ['corazon', 26, 24], ['sakura', 23, 23], ['estrella', 21, 21], ['moneda', 24, 24], ['cerezas', 18, 17]]
    .map(([n, w, h], i) => `<img src="assets/${n}.svg" alt="" width="${w}" height="${h}" style="--i:${i}">`).join('');
  const anteriores = resto.map((n) => `
    <li class="novedad">
      <details>
        <summary><span class="nov-pill">v${esc(n.version)}</span><span lang="es">${esc(n.titulo)}</span><time datetime="${n.fecha}">${fecha(n.fecha)}</time></summary>
        <ul lang="es">${n.cambios.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      </details>
    </li>`).join('');
  vista.innerHTML = `
    <section class="pagina angosta">
      <h1 class="display">${t('nov_titulo')}</h1>
      <article class="nov-hero">
        <div class="nov-confeti" aria-hidden="true">${confeti}</div>
        <p class="nov-etiqueta">${ICON.brillo}<span>${t('nov_nueva')}</span></p>
        <p class="nov-version">v${esc(ultima.version)}</p>
        <h2 lang="es">${esc(ultima.titulo)}</h2>
        <p class="nov-fecha"><time datetime="${ultima.fecha}">${fecha(ultima.fecha)}</time></p>
        <ul class="nov-cambios" lang="es">${ultima.cambios.map((c, i) => `<li style="--i:${i}">${ICON.check}<span>${esc(c)}</span></li>`).join('')}</ul>
      </article>
      ${resto.length ? `<h2 class="nov-sub">${t('nov_anteriores')}</h2><ol class="novedades">${anteriores}</ol>` : ''}
    </section>`;
  sonido.fin();
}

// ---------- Ajustes ----------
function vistaAjustes() {
  const a = S.ajustes;
  const opcion = (grupo, valor, texto, actual) => `<button type="button" role="radio" aria-checked="${valor === actual}" data-${grupo}="${valor}">${texto}</button>`;
  const pendientes = S.sugerencias.filter((s) => s.enviada).length;
  vista.innerHTML = `
    <section class="pagina angosta ajustes">
      <h1 class="display">${t('aj_titulo')}</h1>

      <div class="card">
        <h2>${t('perfil')}</h2>
        <label class="campo"><span>${t('aj_nombre')}</span><input id="aj-nombre" maxlength="30" value="${esc(S.perfil.nombre)}" autocomplete="nickname"></label>
        <dl class="datos">
          <div><dt>${t('aj_cuenta')}</dt><dd>${S.perfil.cuenta ? `${esc(S.perfil.cuenta.email)}<br><small class="suave">${t('nube_guardando')}</small>` : t('aj_invitado')}</dd></div>
          <div><dt>${t('rank_racha')}</dt><dd>${store.rachaVigente(S.racha)}</dd></div>
          <div><dt>${t('aj_mejor_racha')}</dt><dd>${S.racha.mejor}</dd></div>
          <div><dt>Kitty tokens</dt><dd>${S.tokens}</dd></div>
        </dl>
        ${S.perfil.cuenta ? `<label class="interruptor"><input type="checkbox" id="aj-ranking" ${a.ranking !== false ? 'checked' : ''}><span>${t('aj_ranking')}</span></label>` : ''}
        ${S.perfil.cuenta ? `<button class="btn fantasma ancho" type="button" id="aj-salir">${t('aj_salir')}</button>`
          : `<button class="btn ancho" type="button" id="aj-google">${ICON.google}<span>${t('aj_google')}</span></button>`}
        <a class="enlace pequeno" href="#/conservar?demo=1">${t('cons_titulo')} (demo)</a>
      </div>

      <div class="card">
        <h2>${t('aj_apariencia')}</h2>
        <p class="etiqueta" id="lbl-tema">${t('aj_tema')}</p>
        <div class="seg" role="radiogroup" aria-labelledby="lbl-tema">
          ${opcion('tema', 'sistema', t('aj_sistema'), a.tema)}${opcion('tema', 'claro', t('aj_claro'), a.tema)}${opcion('tema', 'oscuro', t('aj_oscuro'), a.tema)}
        </div>
        <p class="etiqueta" id="lbl-paleta">${t('aj_paleta')}</p>
        <div class="paletas" role="radiogroup" aria-labelledby="lbl-paleta">
          ${PALETAS.map((p) => `<button type="button" role="radio" aria-checked="${p === a.paleta}" data-paleta="${p}"><i class="muestra muestra-${p}" aria-hidden="true"></i>${t('pal_' + p)}</button>`).join('')}
        </div>
        <label class="campo"><span>${t('aj_letra')} · <output id="o-escala">${Math.round(a.escala * 100)}%</output></span>
          <input type="range" id="aj-escala" min="0.9" max="1.3" step="0.05" value="${a.escala}"></label>
        <label class="campo"><span>${t('aj_brillo')} · <output id="o-brillo">${Math.round(a.brillo * 100)}%</output></span>
          <input type="range" id="aj-brillo" min="0.5" max="1" step="0.05" value="${a.brillo}"></label>
        <label class="interruptor"><input type="checkbox" id="aj-ipa" ${a.ipa ? 'checked' : ''}><span>${t('aj_ipa')}</span></label>
        <label class="interruptor"><input type="checkbox" id="aj-sonido" ${a.sonido ? 'checked' : ''}><span>${t('aj_sonido')}</span></label>
        <label class="interruptor"><input type="checkbox" id="aj-musica" ${a.musica ? 'checked' : ''}><span>${t('aj_musica')}</span></label>
      </div>

      <div class="card">
        <h2>${t('rec_titulo')}</h2>
        <label class="interruptor"><input type="checkbox" id="aj-recordatorio" ${a.recordatorio ? 'checked' : ''}><span>${t('rec_activar')}</span></label>
        <label class="campo"><span>${t('rec_hora')}</span><input type="time" id="aj-hora" value="${esc(a.horaRecordatorio)}" step="900"></label>
        <button class="btn ancho" type="button" id="aj-calendario">${ICON.calendario}<span>${t('rec_calendario')}</span></button>
        <p class="suave pequeno">${t('rec_cal_nota')}</p>
      </div>

      <div class="card">
        <h2>${t('aj_app')}</h2>
        <div class="fila-app">${iconoApp()}<p class="suave">${instalada() ? t('inst_ya') : t('inst_texto')}</p></div>
        ${botonInstalar('btn ancho')}
      </div>

      <div class="card">
        <h2>${t('aj_meta')}</h2>
        <p class="meta-fija"><strong>${t('meta_n', { n: store.META_DIA })}</strong> · ${t('aj_meta_fija')}</p>
        <p class="flores-meta" aria-hidden="true">${[0, 1, 2, 3, 4].map((e) => `<img src="${srcFlor(e)}" alt="" width="23" height="23">`).join('<span>›</span>')}</p>
      </div>

      <div class="card">
        <h2>${t('idioma_nativo')}</h2>
        <label class="campo"><span class="sr-only">${t('idioma_nativo')}</span>
          <select id="aj-nativo">${IDIOMAS_UI.map((c) => `<option value="${c}" ${c === a.nativo ? 'selected' : ''}>${esc(nombreIdioma(c, c))}</option>`).join('')}</select></label>
        <a class="btn fantasma ancho" href="#/idiomas">${t('aprendiendo')}: ${S.aprendiendo ? esc(nombreIdioma(S.aprendiendo)) : '—'}</a>
      </div>

      <div class="card">
        <h2>${t('aj_kitty')}</h2>
        <p class="suave">${t('aj_kitty_texto')}</p>
      </div>

      ${esCreadora() ? `<a class="card buzon-acceso" href="#/buzon">${ICON.enviar}<span>${t('buzon_abrir')}</span>${ICON.flecha}</a>` : ''}
      <div class="card">
        <h2>${t('aj_sugerencias')}</h2>
        <form id="f-sug">
          <label class="campo"><span>${t('aj_sug_texto')}</span><textarea id="aj-sug" rows="3" maxlength="2000" required></textarea></label>
          <button class="btn primario" type="submit">${ICON.enviar}<span>${t('aj_enviar')}</span></button>
          ${pendientes ? `<p class="suave pequeno">✓ ${pendientes}</p>` : ''}
        </form>
      </div>

      <div class="card lista-enlaces">
        <button type="button" id="aj-tutorial">${t('tut_ver')}${ICON.flecha}</button>
        <a href="#/favoritos">${t('fav_titulo')}${ICON.flecha}</a>
        <a href="#/novedades">${t('nov_titulo')}${ICON.flecha}</a>
        <button type="button" data-modal="cosmeticos">${t('aj_cosmeticos')} <span class="tag tag-pronto">${t('pronto')}</span>${ICON.flecha}</button>
        <button type="button" data-modal="apoyar">${t('aj_apoyar')} <span class="tag tag-pronto">${t('pronto')}</span>${ICON.flecha}</button>
        <button type="button" data-modal="legal">${t('aj_legal')}${ICON.flecha}</button>
      </div>

      <button class="btn peligro ancho" type="button" id="aj-borrar">${t('aj_borrar')}</button>
      <p class="suave pequeno centro">${t('aj_guardado_auto')}</p>
    </section>`;

  $('#aj-nombre').addEventListener('input', (e) => { S.perfil.nombre = e.target.value.trim(); guardar(); pintarMarco('ajustes'); });
  $('#aj-google')?.addEventListener('click', conectarGoogle);
  $('#aj-salir')?.addEventListener('click', salirDeGoogle);
  $('#aj-ranking')?.addEventListener('change', (e) => {
    a.ranking = e.target.checked;
    guardar();
    if (a.ranking) publicarMiRanking();
    else if (conCuenta()) nube.borrarRanking(S.perfil.cuenta.uid).catch(() => {});
  });
  $$('[data-tema]').forEach((b) => b.addEventListener('click', () => { a.tema = b.dataset.tema; guardar(); aplicarAjustes(); vistaAjustes(); }));
  $$('.paletas [data-paleta]').forEach((b) => b.addEventListener('click', () => { a.paleta = b.dataset.paleta; guardar(); aplicarAjustes(); vistaAjustes(); }));
  $('#aj-escala').addEventListener('input', (e) => { a.escala = Number(e.target.value); $('#o-escala').textContent = `${Math.round(a.escala * 100)}%`; aplicarAjustes(); guardar(); });
  $('#aj-brillo').addEventListener('input', (e) => { a.brillo = Number(e.target.value); $('#o-brillo').textContent = `${Math.round(a.brillo * 100)}%`; aplicarAjustes(); guardar(); });
  $('#aj-ipa').addEventListener('change', (e) => { a.ipa = e.target.checked; guardar(); });
  $('#aj-recordatorio').addEventListener('change', async (e) => {
    if (!e.target.checked) { a.recordatorio = false; guardar(); rec.desactivarAvisos().catch(() => {}); rec.publicarEstado({ activo: false }).catch(() => {}); return; }
    const r = await rec.activarAvisos().catch(() => 'no-soporta');
    a.recordatorio = r === 'ok';
    e.target.checked = a.recordatorio;
    guardar();
    toast(r === 'ok' ? t('rec_ok', { h: a.horaRecordatorio }) : t(r === 'sin-permiso' ? 'rec_sin_permiso' : 'rec_no_soporta'));
  });
  $('#aj-hora').addEventListener('change', (e) => { if (e.target.value) { a.horaRecordatorio = e.target.value; guardar(); } });
  $('#aj-calendario').addEventListener('click', descargarCalendario);
  $('#aj-musica').addEventListener('change', (e) => { a.musica = e.target.checked; musica(a.musica); guardar(); });
  $('#aj-sonido').addEventListener('change', (e) => { a.sonido = e.target.checked; activarSonido(a.sonido); guardar(); if (a.sonido) sonido.moneda(); });
  $('#aj-nativo').addEventListener('change', (e) => cambiarNativo(e.target.value));
  $('#f-sug').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!store.agregarSugerencia(S, $('#aj-sug').value)) return;
    guardarYa();
    enviarSugerenciasPendientes().then((n) => { toast(t(n ? 'sug_enviada' : 'sug_pendiente')); vistaAjustes(); });
  });
  $$('[data-modal]').forEach((b) => b.addEventListener('click', () => {
    const m = b.dataset.modal;
    if (m === 'cosmeticos') abrirCosmeticos();
    if (m === 'apoyar') modal(t('aj_apoyar'), `<p>${t('aj_apoyar_texto')}</p>`);
    if (m === 'legal') modal(t('aj_legal'), `<p>${t('legal_texto')}</p>
      <ul class="enlaces-legales" lang="es"><li><a href="../legal/privacidad.html" target="_blank" rel="noopener">Política de privacidad</a></li>
      <li><a href="../legal/terminos.html" target="_blank" rel="noopener">Términos y condiciones</a></li>
      <li><a href="../legal/cookies.html" target="_blank" rel="noopener">Política de cookies</a></li></ul>`);
  }));
  function abrirCosmeticos() {
    modal(t('aj_cosmeticos'), `<p>${t('aj_cos_texto')}</p><p class="chip"><img class="moneda" src="assets/moneda.svg" alt="" width="24" height="24">${S.tokens}</p>`);
  }
  // Confirmación dentro de la app (sin confirm(): no funciona en todos los navegadores ni en vistas incrustadas)
  $('#aj-tutorial').addEventListener('click', () => {
    S.tutorialVisto = false; guardar();
    location.hash = S.aprendiendo ? `#/estudiar?${new URLSearchParams({ mega: MEGA_TEMAS[0], dif: 'todas' })}` : '#/idiomas';
  });
  $('#aj-borrar').addEventListener('click', () => {
    modal(t('aj_borrar'), `<p>${t('aj_borrar_confirmar')}</p><button class="btn peligro ancho" type="button" id="aj-borrar-si">${t('aj_borrar')}</button>`);
    $('#aj-borrar-si').addEventListener('click', () => {
      $('#modal').close();
      const ajustes = S.ajustes;
      setS(store.estadoInicial());
      S.ajustes = ajustes;
      S.perfil.elegido = true;
      guardarYa();
      router();
    });
  });
}

// ---------- Arranque ----------
S.ajustes.nativo ??= nativoInicial();
await cargarIdiomaUI(S.ajustes.nativo); // solo se descargan los textos del idioma de la persona
aplicarAjustes();
if (store.usarProtectores(S)) { store.guardar(S); setTimeout(() => toast(t('protector_usado')), 1500); }
if (traspasado) setTimeout(() => toast(t('traspaso_ok')), 1200);
setTimeout(() => enviarSugerenciasPendientes(), 3000);
{ const c = store.actualizarLiga(S); if (c === 'sube' || c === 'baja') { store.guardar(S); setTimeout(() => toast(t(c === 'sube' ? 'liga_sube' : 'liga_baja', { liga: t('liga_' + store.LIGAS[S.liga.nivel]) })), 2200); } }
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', aplicarAjustes);
router();
sincronizarAlAbrir();
