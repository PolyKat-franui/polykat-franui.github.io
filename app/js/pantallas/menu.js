// ---------- Menú principal (estilo juego) ----------
import { t, tn } from '../i18n.js';
import * as store from '../store.js';
import * as banco from '../banco.js';
import { hablar } from '../voz.js';
import { ICON } from '../iconos.js';
import { sonido } from '../sonido.js';
import { estallido } from '../adornos.js';
import * as J from '../jardin.js';
import * as PD from '../palabra-dia.js';
import { $, $$, esc, vista, cara, toast, estallarCorazones } from '../ui.js';
import { S, guardar } from '../estado.js';
import { marcarAvisoNovedades, hoyRevisadas, etapaHoy, srcFlor } from '../marco.js';
import { botonInstalar } from '../instalacion.js';
import { idiomaPrincipal, pintarPalabraMenu } from './palabra.js';
import { nombreEtapa, srcArbol } from './pantalla-jardin.js';

/** Historia del día de Kitty (como Instagram): 3 pantallas que avanzan solas; una frase nueva cada día. */
async function abrirHistoria() {
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  if (!meta) { location.hash = '#/idiomas'; return; }
  await banco.prepararPar(meta, nativo);
  const frases = banco.disponibles(meta, nativo).filter((c) => c.tipos.includes('frase'));
  if (!frases.length) { toast(t('hist_sin')); return; }
  const c = frases[store.indiceDelDia(store.diaLocal(Date.now()), frases.length)];
  const frase = banco.texto(meta, c.id).texto, trad = banco.texto(nativo, c.id).texto;
  store.marcarHistoriaVista(S); guardar();
  $('#menu-historia')?.classList.add('vista');
  const pantallas = [
    `<img class="historia-kitty" src="${cara('feliz')}" alt="" width="80" height="64"><p class="historia-dice">${t('hist_k1')}</p>
     <p class="historia-frase" lang="${meta}">${esc(frase)}</p>
     <button class="icon-btn historia-audio" type="button" aria-label="${t('escuchar')}">${ICON.audio}</button>`,
    `<p class="historia-dice">${t('hist_signif')}</p><p class="historia-frase" lang="${meta}">${esc(frase)}</p>
     <p class="historia-trad" lang="${nativo}">${esc(trad)}</p>`,
    `<img class="historia-kitty" src="${cara('guino')}" alt="" width="80" height="64"><p class="historia-dice">${t('hist_k3')}</p>
     <button class="btn primario historia-fav" type="button" aria-pressed="${store.esFavorito(S, meta, c.id)}">${ICON.corazon}<span>${t(store.esFavorito(S, meta, c.id) ? 'hist_guardada' : 'hist_guardar')}</span></button>`,
  ];
  const capa = document.createElement('div');
  capa.className = 'historia-capa'; capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true'); capa.setAttribute('aria-label', t('hist_titulo'));
  capa.innerHTML = `<div class="historia">
      <div class="historia-barras">${pantallas.map(() => '<i></i>').join('')}</div>
      <div class="historia-cabeza"><span>${t('hist_titulo')}</span><button class="icon-btn historia-cerrar" type="button" aria-label="${t('hist_cerrar')}">${ICON.cerrar}</button></div>
      <div class="historia-cuerpo" aria-live="polite"></div>
      <button class="historia-zona izq" type="button" aria-label="${t('hist_ant')}"></button><button class="historia-zona der" type="button" aria-label="${t('hist_sig')}"></button>
    </div>`;
  document.body.append(capa);
  let i = 0, timer = null;
  const cerrar = () => { clearTimeout(timer); capa.remove(); document.removeEventListener('keydown', teclas); $('#menu-historia')?.focus(); };
  const ir = (n) => { if (n >= pantallas.length) return cerrar(); i = Math.max(0, n); pintar(); };
  const pintar = () => {
    clearTimeout(timer);
    $('.historia-cuerpo', capa).innerHTML = pantallas[i];
    $$('.historia-barras i', capa).forEach((b, k) => { b.className = k < i ? 'llena' : ''; });
    const barra = $$('.historia-barras i', capa)[i]; void barra.offsetWidth; barra.className = 'llenando';
    if (i < pantallas.length - 1) timer = setTimeout(() => ir(i + 1), 6000);
    $('.historia-audio', capa)?.addEventListener('click', (e) => { e.stopPropagation(); if (!hablar(frase, meta)) toast(t('sin_voz')); });
    $('.historia-fav', capa)?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!store.esFavorito(S, meta, c.id)) { store.alternarFavorito(S, meta, c.id); guardar(); sonido.like(); estallarCorazones(e.currentTarget); }
      e.currentTarget.setAttribute('aria-pressed', 'true');
      $('span', e.currentTarget).textContent = t('hist_guardada');
    });
  };
  const teclas = (e) => { if (e.key === 'Escape') cerrar(); else if (e.key === 'ArrowRight') ir(i + 1); else if (e.key === 'ArrowLeft') ir(i - 1); };
  document.addEventListener('keydown', teclas);
  $('.historia-cerrar', capa).addEventListener('click', cerrar);
  $('.historia-zona.izq', capa).addEventListener('click', () => ir(i - 1));
  $('.historia-zona.der', capa).addEventListener('click', () => ir(i + 1));
  pintar();
  $('.historia-cerrar', capa).focus();
}

export function vistaMenu() {
  if (J.aparecerCaquitas(S.jardin)) guardar();
  const racha = store.rachaVigente(S.racha);
  const hoy = hoyRevisadas();
  const meta = S.ajustes.meta;
  const faltan = store.PREMIO_CADA - (hoy % store.PREMIO_CADA);
  const letras = [...'POLYKAT'].map((l, i) => `<span style="--i:${i}">${l}</span>`).join('');
  const boton = (href, icon, texto, id) => `<a class="menu-btn" href="${href}" id="${id}">${icon}<span>${texto}</span></a>`;
  vista.innerHTML = `
    <section class="menu-juego">
      <div class="menu-escena">
        <h1 class="menu-logo" aria-label="Polykat">
          <span class="menu-letras" aria-hidden="true">${letras}</span>
          <span class="menu-linea" aria-hidden="true"></span>
        </h1>
        <p class="eslogan menu-eslogan">Be fluent in multiple languages</p>
        <p class="tanzaku" aria-label="Tanzaku">${t('tz_' + store.indiceDelDia(store.diaLocal(Date.now()), 7))}</p>
        <button class="menu-kitty" type="button" id="menu-kitty" aria-label="Kitty">
          <img src="${cara(racha ? 'muy_feliz' : 'feliz')}" alt="" width="160" height="128">
        </button>
      </div>
      <button class="menu-historia ${store.historiaVista(S) ? 'vista' : ''}" type="button" id="menu-historia" aria-label="${t('hist_abrir')}">
        <span class="historia-anillo"><img src="${cara('guino')}" alt="" width="40" height="32"></span>
        <span>${t('hist_titulo')}</span>
      </button>
      <a class="menu-palabra ${PD.vistaHoy(S) ? 'vista' : ''}" href="#/palabra" id="menu-palabra">
        <span class="menu-palabra-txt"><small>${t('pd_titulo')}</small><strong id="menu-palabra-texto" lang="${idiomaPrincipal()}">…</strong>
          <span>${PD.vistaHoy(S) ? t('pd_vista') : t('pd_ver')}</span></span>
        ${PD.vistaHoy(S) ? '' : `<span class="menu-palabra-nueva">${t('pd_nueva')}</span>`}
        ${ICON.flecha}
      </a>
      <a class="menu-jardin" href="#/jardin" id="menu-jardin">
        <span class="menu-jardin-arbol"><img src="${srcArbol(J.nivelDe(S.jardin.crecimiento))}" alt="" width="64" height="64"></span>
        <span class="menu-jardin-txt"><small>${t('jar_titulo')}</small><strong>${esc(nombreEtapa(J.nivelDe(S.jardin.crecimiento)))} · ${t('jar_nivel', { n: J.nivelDe(S.jardin.crecimiento) })}</strong>
          <span>${S.jardin.caquitas?.length ? tn('caq_aviso_n', S.jardin.caquitas.length) : J.pendiente(S.jardin) ? t('jar_listos', { n: J.pendiente(S.jardin) }) : t('jar_ir')}</span></span>
        ${ICON.flecha}
      </a>
      <ul class="menu-stats">
        <li><img src="assets/sakura.svg" alt="" width="23" height="23"><span>${tn('racha_n', racha)}</span></li>
        <li><img src="assets/moneda.svg" alt="" width="24" height="24"><span>${t('tokens_n', { n: S.tokens })}</span></li>
        <li class="menu-diamantes"><img src="assets/diamante.svg" alt="" width="25" height="19"><span>${tn('dia_n', S.diamantes ?? 0)}</span></li>
        <li class="menu-hoy">
          <img class="menu-flor" src="${srcFlor(etapaHoy())}" alt="" width="46" height="46">
          <span>${t('menu_hoy', { n: hoy })}</span>
          <span class="progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${meta}" aria-valuenow="${Math.min(hoy, meta)}" aria-label="${t('meta_progreso', { n: Math.min(hoy, meta), m: meta })}"><i style="width:${Math.min(100, (hoy / meta) * 100)}%"></i></span>
          <small>${hoy >= meta ? t('meta_lista') : t('meta_progreso', { n: hoy, m: meta })} · ${t('menu_premio', { n: faltan })}</small>
        </li>
      </ul>
      <nav class="menu-botones" aria-label="${t('menu_titulo')}">
        <a class="menu-jugar" id="menu-jugar" href="${S.aprendiendo ? '#/estudiar?dif=todas' : '#/idiomas'}">${ICON.jugar}<span>${t('menu_jugar')}</span></a>
        ${boton('#/aprender', ICON.libro, t('menu_temas'), 'menu-temas')}
        ${boton('#/libre', ICON.todas, t('libre_titulo'), 'menu-libre')}
        ${boton('#/favoritos', ICON.corazon, t('nav_favoritos'), 'menu-favoritos')}
        ${boton('#/ranking', ICON.trofeo, t('nav_ranking'), 'menu-ranking')}
        ${boton('#/idiomas', `<span class="monograma pequeno" aria-hidden="true">${esc((S.aprendiendo || '?').toUpperCase())}</span>`, t('menu_idioma'), 'menu-idioma')}
        ${boton('#/novedades', ICON.estrella, t('nav_novedades'), 'menu-novedades')}
        ${boton('#/ajustes', ICON.ajustes, t('nav_ajustes'), 'menu-ajustes')}
      </nav>
      ${botonInstalar()}
    </section>`;
  marcarAvisoNovedades();
  pintarPalabraMenu();
  $('#menu-historia').addEventListener('click', abrirHistoria);
  // Tocar una letra de POLYKAT: salta y suena una moneda (cada letra un poco más aguda)
  $('.menu-letras').addEventListener('click', (e) => {
    const l = e.target.closest('span[style]');
    if (!l) return;
    l.classList.remove('salta'); void l.offsetWidth; l.classList.add('salta');
    sonido.moneda(0, Number(l.style.getPropertyValue('--i')) * 2);
  });
  // Tocar a Kitty: salta, cambia de cara y suelta sakuras y monedas
  const CARAS = ['celebrando', 'guino', 'enamorada', 'sorprendida', 'muy_feliz'];
  let n = 0;
  $('#menu-kitty').addEventListener('click', (e) => {
    const b = e.currentTarget;
    b.querySelector('img').src = cara(CARAS[n++ % CARAS.length]);
    b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta');
    sonido.moneda(0, n % 5);
    const r = b.getBoundingClientRect();
    estallido(r.left + r.width / 2, r.top + r.height / 3, { cantidad: 12 });
  });
}
