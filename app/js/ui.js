// Polykat — piezas de interfaz que usan todas las pantallas: buscar en el DOM, avisos, carga y navegación.
import { t } from './i18n.js';
import { ICON } from './iconos.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const vista = $('#vista');

/** Ruta de una expresión de Kitty (ver app/assets/caras/caras.json). */
export const cara = (nombre) => `assets/caras/${nombre}.svg`;

// ---------- Avisos ----------
let timerToast = null;
export function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visible'), 3200);
}

export function modal(titulo, html) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-cuerpo').innerHTML = html;
  $('#modal-cerrar').textContent = t('cerrar');
  $('#modal').showModal();
}

// ---------- Navegación ----------
// El router vive en main.js (conoce todas las pantallas) y se registra aquí:
// así cualquier módulo puede volver a dibujar la vista sin importar main.js.
let enrutar = () => {};
export const registrarRouter = (fn) => { enrutar = fn; };
export const router = () => enrutar();

/** Navega; si ya estamos en esa dirección, vuelve a dibujar la vista. */
export function ir(hash) {
  if (location.hash === hash) router();
  else location.hash = hash;
}

/** Pantalla de carga: Kitty pensando, dando saltitos, con tres puntos. */
export const htmlCargando = () => `<div class="cargando" role="status" aria-busy="true" aria-label="${t('cargando')}">
  <img class="cargando-kitty" src="${cara('pensando')}" alt="" width="80" height="64">
  <span class="cargando-puntos" aria-hidden="true"><i style="--k:0"></i><i style="--k:1"></i><i style="--k:2"></i></span></div>`;
/** Lista vacía: Kitty con una cara según el caso y el mensaje debajo (clase extra para el párrafo, p. ej. «aviso»). */
export const htmlVacio = (texto, carita = 'pensando', clase = 'suave') => `<div class="vacio-estado"><img class="cara-grande" src="${cara(carita)}" alt="" width="80" height="64"><p class="${clase}">${texto}</p></div>`;
export function cargando() {
  vista.innerHTML = htmlCargando();
}

/** *palabra* → <mark>palabra</mark> (el resto escapado). */
export const marcar = (s) => esc(s).replace(/\*([^*]+)\*/, '<mark>$1</mark>');

export const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Corazones que saltan al marcar favorito. */
export function estallarCorazones(boton) {
  if (sinMovimiento()) return;
  for (let i = 0; i < 6; i++) {
    const h = document.createElement('span');
    h.className = 'chispa-corazon'; h.setAttribute('aria-hidden', 'true'); h.innerHTML = ICON.corazonLleno;
    h.style.setProperty('--a', `${i * 60 + Math.random() * 20}deg`);
    boton.append(h);
    setTimeout(() => h.remove(), 700);
  }
}
