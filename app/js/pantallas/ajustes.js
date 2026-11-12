// ---------- Ajustes ----------
import { t, nombreIdioma, IDIOMAS_UI, MEGA_TEMAS } from '../i18n.js';
import * as store from '../store.js';
import { PALETAS } from '../store.js';
import { ICON } from '../iconos.js';
import { sonido, activarSonido } from '../sonido.js';
import { musica } from '../musica.js';
import * as nube from '../nube.js';
import * as rec from '../recordatorio.js';
import { $, $$, esc, vista, toast, modal, router } from '../ui.js';
import { S, setS, guardar, guardarYa, conCuenta, publicarMiRanking, conectarGoogle, salirDeGoogle, aplicarAjustes } from '../estado.js';
import { pintarMarco, cambiarNativo, srcFlor } from '../marco.js';
import { instalada, iconoApp, botonInstalar } from '../instalacion.js';
import { esCreadora, enviarSugerenciasPendientes } from './buzon.js';
import { medicionActiva, cambiarMedicion } from '../medicion.js';

function descargarCalendario() {
  const a = S.ajustes;
  const ics = rec.crearICS({ hora: a.horaRecordatorio, titulo: t('rec_evento'), descripcion: t('rec_noti_texto'), url: new URL('./', location.href).href });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  enlace.download = 'polykat-recordatorio.ics';
  document.body.append(enlace); enlace.click(); enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 4000);
}

export function vistaAjustes() {
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
        <label class="interruptor"><input type="checkbox" id="aj-medicion" ${medicionActiva() ? 'checked' : ''}><span>${t('aj_medicion')}</span></label>
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
  $('#aj-medicion').addEventListener('change', (e) => cambiarMedicion(e.target.checked));
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
