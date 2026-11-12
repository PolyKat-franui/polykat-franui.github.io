// Polykat — marco de la app: barra superior, pestañas, contadores, idioma de la app y datos que comparten varias pantallas.
import { t, tn, cargarIdiomaUI, nombreIdioma, IDIOMAS_UI } from './i18n.js';
import * as store from './store.js';
import { ICON } from './iconos.js';
import { $, $$, esc, router } from './ui.js';
import { S, guardar, aplicarAjustes } from './estado.js';
import { olvidarEntradasKitty } from './kitty-chat.js';

// ---------- Marco: barra superior, pestañas, Kitty ----------
const NAV = [
  ['aprender', ICON.libro],
  ['jardin', ICON.arbol],
  ['favoritos', ICON.corazon],
  ['ranking', ICON.trofeo],
  ['novedades', ICON.brillo],
];

let tokensVistos = null;

export function actualizarChips() {
  const racha = store.rachaVigente(S.racha);
  const chipR = $('#chip-racha');
  chipR.querySelector('span').textContent = racha;
  chipR.setAttribute('aria-label', tn('racha_n', racha));
  chipR.title = tn('racha_n', racha);
  const chipT = $('#chip-tokens');
  chipT.querySelector('span:last-child').textContent = S.tokens;
  // la moneda gira cuando ganas Kitty tokens
  if (tokensVistos !== null && S.tokens > tokensVistos) {
    const m = chipT.querySelector('.moneda');
    m.classList.remove('gira'); void m.offsetWidth; m.classList.add('gira');
  }
  tokensVistos = S.tokens;
  chipT.setAttribute('aria-label', t('tokens_n', { n: S.tokens }));
  chipT.title = t('tokens_n', { n: S.tokens });
}

export function pintarMarco(ruta) {
  const enInicio = ruta === 'inicio' || ruta === 'menu' || ruta === 'instalar'; // pantallas a pantalla completa, sin barra
  $('#barra').hidden = enInicio;
  $('#tabbar').hidden = enInicio;
  $('#kitty-fab').hidden = enInicio;
  const activa = ruta === 'tema' || ruta === 'estudiar' || ruta === 'idiomas' ? 'aprender' : ruta;
  const links = NAV.map(([k, icon]) =>
    `<a href="#/${k}" ${k === activa ? 'aria-current="page"' : ''}>${icon}<span>${t('nav_' + k)}</span></a>`).join('');
  $('#nav-sup').innerHTML = links;
  $('#tabbar').innerHTML = links;
  marcarAvisoNovedades();
  actualizarChips();
  const bn = $('#btn-nativo');
  bn.innerHTML = `<span class="monograma pequeno" aria-hidden="true">${S.ajustes.nativo.toUpperCase()}</span>`;
  bn.setAttribute('aria-label', `${t('idioma_nativo')}: ${nombreIdioma(S.ajustes.nativo)}`);
  bn.title = t('idioma_nativo');
  const inicial = (S.perfil.nombre || '').trim().charAt(0).toUpperCase();
  const avatar = $('#avatar');
  avatar.innerHTML = inicial ? esc(inicial) : ICON.usuario;
  avatar.setAttribute('aria-label', t('perfil'));
  const aj = $('#btn-ajustes');
  aj.innerHTML = ICON.ajustes;
  aj.setAttribute('aria-label', t('nav_ajustes'));
  $('#kitty-fab').setAttribute('aria-label', t('kitty_abrir'));
  $('#kitty-cerrar').innerHTML = ICON.cerrar;
  $('#kitty-cerrar').setAttribute('aria-label', t('cerrar'));
  $('#kitty-enviar').innerHTML = ICON.enviar;
  $('#kitty-enviar').setAttribute('aria-label', t('aj_enviar'));
  $('#kitty-input').placeholder = t('kitty_placeholder');
  $('#kitty-input').setAttribute('aria-label', t('kitty_placeholder'));
  $('#kitty-modo').textContent = t('kitty_modo');
}
export function pulsoChip() {
  const chip = $('#chip-tokens');
  chip.classList.remove('cobra'); void chip.offsetWidth; chip.classList.add('cobra');
}

// ---------- Aviso de novedades (punto en la pestaña) ----------
export let ultimaVersion = null;      // versión más nueva de Novedades (para el aviso en la pestaña)
export function setUltimaVersion(v) { ultimaVersion = v; }
export function marcarAvisoNovedades() {
  const hay = ultimaVersion && S.novedadVista !== ultimaVersion && !store.esNovato(S);
  $$('a[href="#/novedades"]').forEach((a) => a.classList.toggle('con-aviso', !!hay));
}

// ---------- Idioma de la app ----------
export async function cambiarNativo(code) {
  if (!IDIOMAS_UI.includes(code)) return;
  await cargarIdiomaUI(code);
  S.ajustes.nativo = code;
  if (S.aprendiendo === code) S.aprendiendo = null;
  guardar();
  aplicarAjustes();
  olvidarEntradasKitty();
  router();
}
$('#btn-nativo').addEventListener('click', abrirRedNativo);

// ---------- Red de idiomas en forma de araña (pantalla completa) ----------
/** Dibuja una araña: un idioma al centro y los demás alrededor, unidos por hilos y una tela. */
export function htmlArana(centro, nodos) {
  const n = nodos.length;
  const pos = nodos.map((_, i) => {
    const a = (-90 + (360 * i) / n) * (Math.PI / 180);
    return [50 + 39 * Math.cos(a), 50 + 40 * Math.sin(a)];
  });
  const anillo = (k) => pos.map(([x, y]) => `${(50 + (x - 50) * k).toFixed(2)},${(50 + (y - 50) * k).toFixed(2)}`).join(' ');
  return `
    <div class="arana" style="--n:${n}">
      <svg class="arana-hilos" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon class="tela" points="${anillo(1)}"/><polygon class="tela" points="${anillo(0.66)}"/><polygon class="tela" points="${anillo(0.33)}"/>
        ${pos.map(([x, y], i) => `<line class="hilo" x1="50" y1="50" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" pathLength="100" style="--i:${i}"/>`).join('')}
      </svg>
      <div class="arana-centro">${centro}</div>
      ${nodos.map((html, i) => `<div class="arana-nodo" style="left:${pos[i][0].toFixed(2)}%;top:${pos[i][1].toFixed(2)}%;--i:${i};--c:var(--nodo-${(i % 6) + 1})">${html}</div>`).join('')}
    </div>`;
}

function abrirRedNativo() {
  const capa = $('#capa-idiomas');
  const actual = S.ajustes.nativo;
  const nodos = IDIOMAS_UI.filter((c) => c !== actual).map((c) =>
    `<button type="button" class="nodo-idioma" data-nativo="${c}"><span class="monograma" aria-hidden="true">${c.toUpperCase()}</span><span class="nodo-nombre" lang="${c}">${esc(nombreIdioma(c, c))}</span></button>`);
  capa.innerHTML = `
    <div class="arana-cabeza">
      <h2 id="capa-idiomas-titulo">${t('idioma_nativo')}</h2>
      <button class="icon-btn" type="button" id="capa-idiomas-cerrar" aria-label="${t('cerrar')}">${ICON.cerrar}</button>
    </div>
    ${htmlArana(`<span class="monograma grande" aria-hidden="true">${actual.toUpperCase()}</span><strong lang="${actual}">${esc(nombreIdioma(actual, actual))}</strong>`, nodos)}`;
  capa.hidden = false;
  const cerrar = () => { capa.hidden = true; $('#btn-nativo').focus(); };
  $('#capa-idiomas-cerrar').addEventListener('click', cerrar);
  capa.onkeydown = (e) => { if (e.key === 'Escape') cerrar(); };
  $$('[data-nativo]', capa).forEach((b) => b.addEventListener('click', () => { capa.hidden = true; cambiarNativo(b.dataset.nativo); }));
  $('[data-nativo]', capa)?.focus();
}

// ---------- Datos que comparten varias pantallas ----------
const ICON_NIVEL = { nueva: ICON.nueva, dificil: ICON.dificil, media: ICON.media, facil: ICON.facil, dominada: ICON.dominada };
/** Insignia de dificultad: ícono + texto, en el color de su nivel. */
export const insignia = (niv) => `<span class="nivel" data-nivel="${niv}">${ICON_NIVEL[niv]}<span>${t('niv_' + niv)}</span></span>`;

export const EMOJI_MEGA = {
  'Conversación y vida social': '💬', 'Lenguaje, números y tiempo': '🔢', 'Personas y relaciones': '👪',
  'Cuerpo, salud y emociones': '💗', 'Comida y bebida': '🍙', 'Hogar y vida diaria': '🏠', 'Ropa y compras': '👘',
  'Lugares y viajes': '🗺️', 'Naturaleza y animales': '🌿', 'Trabajo, estudios y sociedad': '💼',
  'Ocio, arte y tecnología': '🎨', 'Descripción y formas': '🔷', 'Acciones y mente': '🧠',
};

// ---------- Sakura del día, racha y cofres ----------
export const hoyRevisadas = () => (S.diario?.dia === store.diaLocal(Date.now()) ? S.diario.revisadas : 0);
export const etapaHoy = () => store.etapaFlor(hoyRevisadas(), S.ajustes.meta);
export const srcFlor = (e) => (e >= store.ETAPAS_FLOR ? 'assets/sakura.svg' : `assets/flor-${e}.svg`);
