// Polykat — arranque y rutas con # (funciona en cualquier hosting estático, p. ej. GitHub Pages).
// Cada pantalla vive en js/pantallas/; lo que comparten, en ui.js, estado.js y marco.js.
import { traspasado } from './traspaso.js'; // primero: puede traer el avance desde la dirección antigua
import { t, tn, cargarIdiomaUI, tMega, nombreIdioma, IDIOMAS_UI, MEGA_TEMAS } from './i18n.js';
import * as store from './store.js';
import { PALETAS } from './store.js';
import { dificultad } from './srs.js';
import { filtrarLibre, ordenar } from './sesion.js';
import * as banco from './banco.js';
import { hablar } from './voz.js';
import { ICON } from './iconos.js';
import { sonido, activarSonido } from './sonido.js';
import { musica } from './musica.js';
import { sembrarAdornos, sembrarVisitantes, estallido } from './adornos.js';
import * as nube from './nube.js';
import * as rec from './recordatorio.js';
import { $, $$, esc, vista, cara, toast, modal, registrarRouter, htmlCargando, htmlVacio, cargando } from './ui.js';
import { S, setS, guardar, guardarYa, conCuenta, filaRanking, publicarMiRanking, conectarGoogle, salirDeGoogle, sincronizarAlAbrir, aplicarAjustes, nativoInicial } from './estado.js';
import { pintarMarco, ultimaVersion, setUltimaVersion, marcarAvisoNovedades, cambiarNativo, insignia, srcFlor } from './marco.js';
import { instalada, avisoDescarga, iconoApp, botonInstalar } from './instalacion.js';
import { vistaInicio, vistaConservar } from './pantallas/inicio.js';
import { vistaIdiomas } from './pantallas/idiomas.js';
import { vistaAprender, vistaTema } from './pantallas/aprender.js';
import { vistaPalabra } from './pantallas/palabra.js';
import { vistaJardin } from './pantallas/pantalla-jardin.js';
import { vistaMenu } from './pantallas/menu.js';
import { vistaInstalar } from './pantallas/instalar.js';
import { cerrarSesion, vistaEstudiar } from './pantallas/estudiar.js';

let primeraCarga = true;

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
