// ---------- Buzón de sugerencias ----------
import { t, tn } from '../i18n.js';
import * as nube from '../nube.js';
import { $, $$, esc, vista, toast, modal, htmlCargando, htmlVacio } from '../ui.js';
import { S, guardarYa, conCuenta } from '../estado.js';
import { ultimaVersion } from '../marco.js';

export const esCreadora = () => conCuenta() && S.perfil.cuenta.email?.toLowerCase() === nube.CREADORA;
let enviando = null;
/** Envía a la nube las sugerencias guardadas que aún no salieron. Devuelve cuántas se enviaron. */
export function enviarSugerenciasPendientes() {
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
export async function vistaBuzon() {
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
