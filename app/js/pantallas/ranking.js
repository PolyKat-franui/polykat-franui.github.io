// ---------- Ranking ----------
import { t } from '../i18n.js';
import * as store from '../store.js';
import { ICON } from '../iconos.js';
import * as nube from '../nube.js';
import { $, $$, esc, vista, htmlCargando, htmlVacio } from '../ui.js';
import { S, conCuenta, filaRanking, conectarGoogle } from '../estado.js';

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

export async function vistaRanking() {
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
