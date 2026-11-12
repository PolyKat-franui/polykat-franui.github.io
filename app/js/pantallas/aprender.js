// ---------- Temas (13 mega temas) como red de neuronas ----------
import { t, tn, tMega, nombreIdioma, MEGA_TEMAS } from '../i18n.js';
import * as store from '../store.js';
import { dificultad } from '../srs.js';
import { ordenar, grupoDificultad, bloques, bloqueActual } from '../sesion.js';
import * as banco from '../banco.js';
import { ICON } from '../iconos.js';
import { $, $$, esc, vista, toast, cargando } from '../ui.js';
import { S } from '../estado.js';
import { vistaIdiomas } from './idiomas.js';

const ICON_DIF = { todas: ICON.todas, facil: ICON.facil, medio: ICON.media, dificil: ICON.dificil };
/** Cada tema toma uno de los 6 colores de la paleta elegida (--nodo-1…6). */
const colorTema = (mega) => `var(--nodo-${(MEGA_TEMAS.indexOf(mega) % 6) + 1})`;
const CARRILES = [0, 1, 2, 1]; // zigzag de la red: izquierda, centro, derecha, centro…

function resumenMega(lista, mega, prog) {
  const ids = lista.filter((c) => c.megas.includes(mega)).map((c) => c.id);
  const vistas = ids.filter((id) => (prog[id]?.c ?? 0) >= 1).length;
  return { ids, pct: ids.length ? Math.round((vistas / ids.length) * 100) : 0 };
}

export async function vistaAprender() {
  if (!S.aprendiendo) return vistaIdiomas();
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  cargando();
  await banco.prepararPar(meta, nativo);
  const lista = banco.disponibles(meta, nativo);
  const prog = store.progresoDe(S, meta);
  const nodos = MEGA_TEMAS.map((m, i) => {
    const { ids, pct } = resumenMega(lista, m, prog);
    const vacio = !ids.length;
    return `<li class="nodo carril-${CARRILES[i % 4]}" style="--c:${colorTema(m)};--i:${i + 1}">
        <a class="neurona ${vacio ? 'vacio' : ''}" href="#/tema/${encodeURIComponent(m)}" ${vacio ? 'aria-disabled="true" tabindex="-1"' : ''}>
          <span class="neurona-soma" role="progressbar" aria-label="${esc(tMega(m))}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" style="--p:${pct}"><span class="neurona-pct">${pct}%</span></span>
          <span class="neurona-txt"><strong>${esc(tMega(m))}</strong><small>${vacio ? t('traduccion_en_camino') : tn('tarjetas_n', ids.length)}</small></span>
        </a>
      </li>`;
  }).join('');
  vista.innerHTML = `
    <section class="pagina">
      <div class="cabecera-aprender">
        <div>
          <p class="sobretitulo">${t('aprendiendo')} · <span lang="${meta}">${esc(nombreIdioma(meta))}</span></p>
          <h1 class="display">${t('temas_titulo')}</h1>
          <p class="suave">${t('temas_sub')}</p>
        </div>
        ${store.esNovato(S)
          ? `<a class="btn primario libre-btn empieza-btn" href="#/estudiar?${new URLSearchParams({ mega: MEGA_TEMAS[0], dif: 'todas' })}" id="empieza-aqui">${ICON.jugar}<span>${t('empieza_aqui')}</span></a>`
          : `<a class="btn libre-btn" href="#/libre" id="ir-libre">${ICON.libro}<span>${t('libre_abrir')}</span></a>`}
      </div>
      <div class="red" id="red">
        <svg class="red-sinapsis" aria-hidden="true"></svg>
        <ol class="red-nodos">
          <li class="nodo carril-1 raiz" style="--c:var(--primary);--i:0">
            <a class="neurona" href="#/idiomas" aria-label="${t('cambiar_idioma')}">
              <span class="neurona-soma"><span class="neurona-pct">${meta.toUpperCase()}</span></span>
              <span class="neurona-txt"><strong lang="${meta}">${esc(nombreIdioma(meta))}</strong><small>${t('cambiar_idioma')}</small></span>
            </a>
          </li>
          ${nodos}
        </ol>
      </div>
    </section>`;
  $$('.neurona.vacio').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); toast(t('traduccion_en_camino')); }));
  dibujarSinapsis();
}

/** Une las neuronas con curvas (axones) y líneas finas (dendritas); un impulso recorre cada axón. */
function dibujarSinapsis() {
  const red = $('#red');
  if (!red) return;
  const svg = $('.red-sinapsis', red);
  const caja = red.getBoundingClientRect();
  const nodos = $$('.nodo', red);
  const pts = nodos.map((n) => { const r = $('.neurona-soma', n).getBoundingClientRect(); return [r.left - caja.left + r.width / 2, r.top - caja.top + r.height / 2]; });
  const curva = ([x1, y1], [x2, y2]) => { const my = (y1 + y2) / 2; return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${x1.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
  let html = '';
  for (let i = 0; i + 2 < pts.length; i++) html += `<path class="dendrita" d="${curva(pts[i], pts[i + 2])}"/>`;
  for (let i = 0; i + 1 < pts.length; i++) {
    const c = nodos[i + 1].style.getPropertyValue('--c');
    html += `<path class="axon" style="--c:${c}" d="${curva(pts[i], pts[i + 1])}"/><path class="impulso" style="--c:${c};--i:${i}" pathLength="100" d="${curva(pts[i], pts[i + 1])}"/>`;
  }
  svg.setAttribute('viewBox', `0 0 ${caja.width.toFixed(0)} ${caja.height.toFixed(0)}`);
  svg.innerHTML = html;
}
let timerRed = 0;
addEventListener('resize', () => { clearTimeout(timerRed); timerRed = setTimeout(dibujarSinapsis, 120); });

// ---------- Un mega tema: dificultad y empezar (sin subtemas, decisión 2026-10-13) ----------
export async function vistaTema(r) {
  const mega = r.args[0];
  if (!S.aprendiendo || !MEGA_TEMAS.includes(mega)) return void (location.hash = '#/aprender');
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  cargando();
  await banco.prepararPar(meta, nativo);
  const lista = banco.disponibles(meta, nativo);
  const base = lista.filter((c) => c.megas.includes(mega));
  const prog = store.progresoDe(S, meta);
  const { pct } = resumenMega(lista, mega, prog);
  let dif = 'todas';

  const pintar = () => {
    const sel = dif === 'todas' ? base : base.filter((c) => grupoDificultad(c) === dif);
    const ids = ordenar(sel).map((c) => c.id);
    const bl = bloques(ids);
    const dominadas = ids.filter((id) => dificultad(prog[id]) === 'dominada').length;
    $('#tema-info').textContent = ids.length
      ? `${tn('tarjetas_n', ids.length)} · ${t('bloque_n', { n: bloqueActual(bl, prog) + 1, total: bl.length })}${dominadas ? ' · ' + t('dominadas_n', { n: dominadas }) : ''}`
      : '—';
    const cuenta = (d) => (d === 'todas' ? base.length : base.filter((c) => grupoDificultad(c) === d).length);
    $('#difs').innerHTML = ['todas', 'facil', 'medio', 'dificil'].map((d) =>
      `<button type="button" class="dif-opcion" role="radio" aria-checked="${d === dif}" data-dif="${d}" ${cuenta(d) ? '' : 'disabled'}>
        ${ICON_DIF[d]}<span>${t('dif_' + d)}</span><small>${cuenta(d)}</small></button>`).join('');
    $$('#difs button').forEach((b) => b.addEventListener('click', () => { dif = b.dataset.dif; pintar(); }));
    $('#btn-empezar').disabled = !ids.length;
  };

  vista.innerHTML = `
    <section class="pagina angosta tema-pagina" style="--c:${colorTema(mega)}">
      <a class="volver" href="#/aprender">${ICON.atras}<span>${t('volver')}</span></a>
      <div class="tema-cabeza">
        <span class="neurona-soma grande" role="progressbar" aria-label="${esc(tMega(mega))}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" style="--p:${pct}"><span class="neurona-pct">${pct}%</span></span>
        <div><h1 class="display">${esc(tMega(mega))}</h1><p class="suave" id="tema-info"></p></div>
      </div>
      <p class="sobretitulo" id="lbl-dif">${t('dificultad')}</p>
      <div class="difs" id="difs" role="radiogroup" aria-labelledby="lbl-dif"></div>
      <div class="cta-fija"><button class="btn primario grande" id="btn-empezar">${t('empezar')}</button></div>
    </section>`;
  pintar();
  $('#btn-empezar').addEventListener('click', () => { location.hash = `#/estudiar?${new URLSearchParams({ mega, dif })}`; });
}
