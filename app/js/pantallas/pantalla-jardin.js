// ---------- Jardín de Sakura y tienda de Kitty ----------
import { t } from '../i18n.js';
import * as store from '../store.js';
import { ICON } from '../iconos.js';
import { sonido } from '../sonido.js';
import { estallido, lluvia } from '../adornos.js';
import * as J from '../jardin.js';
import { $, $$, esc, vista, cara, toast, sinMovimiento } from '../ui.js';
import { S, guardar } from '../estado.js';
import { actualizarChips, pulsoChip } from '../marco.js';

export const nombreEtapa = (nivel) => t(`etapa_${J.etapaDe(nivel)}`);
export const srcArbol = (nivel) => `assets/jardin/arbol-${J.etapaDe(nivel)}.svg`;
const nombreObjeto = (id) => t(`it_${id.replace(/-/g, '_')}`);
/** Estudiar riega el sakura; si sube de nivel durante la sesión, solo un aviso (sin interrumpir). */
export function regarJardin(n) {
  const { antes, despues } = J.crecer(S, n);
  if (despues > antes) setTimeout(() => toast(espacioNuevo(antes, despues) ?? t('jar_sube_toast', { n: despues })), 1200);
}
/** Si subir de nivel abrió un espacio del mundo, el texto del aviso. */
function espacioNuevo(antes, despues) {
  const e = J.MUNDO.find((m) => m.nivel > antes && m.nivel <= despues);
  return e ? t('mundo_nuevo', { nombre: t('mundo_' + e.id) }) : null;
}
function celebrarNivel(nivel) {
  document.querySelector('.premio-capa')?.remove();
  const capa = document.createElement('div');
  capa.className = 'premio-capa jardin-sube';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-labelledby', 'sube-titulo');
  capa.innerHTML = `
    <div class="premio-caja">
      <p class="premio-titulo" id="sube-titulo">${t('jar_sube_titulo')}</p>
      <img class="sube-arbol" src="${srcArbol(nivel)}" alt="" width="192" height="192">
      <p class="premio-texto">${t('jar_sube_texto', { n: nivel, nombre: nombreEtapa(nivel), p: J.produccionPorHora(S.jardin) })}</p>
      ${J.MUNDO.some((m) => m.nivel === nivel) ? `<p class="premio-texto"><strong>${espacioNuevo(nivel - 1, nivel)}</strong></p><a class="btn grande" href="#/jardin?t=mundo&e=${J.MUNDO.find((m) => m.nivel === nivel).id}" id="sube-mundo">${ICON.mapa}<span>${t('jar_tab_mundo')}</span></a>` : ''}
      <button class="btn primario grande" type="button" id="sube-ok">${t('premio_ok')}</button>
    </div>`;
  document.body.append(capa);
  sonido.premio();
  lluvia({ cantidad: 30, monedas: 0.15 });
  const cerrar = () => { capa.classList.add('saliendo'); setTimeout(() => capa.remove(), 300); };
  $('#sube-ok', capa).addEventListener('click', cerrar);
  $('#sube-mundo', capa)?.addEventListener('click', cerrar);
  capa.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  $('#sube-ok', capa).focus({ preventScroll: true });
}

let modoDecorar = false;
export function vistaJardin(r) {
  J.iniciar(S);
  guardar();
  const tab = ['tienda', 'mundo'].includes(r.q.get('t')) ? r.q.get('t') : 'jardin';
  const j = S.jardin;
  const nivel = J.nivelDe(j.crecimiento);
  const desde = J.umbral(nivel), hasta = J.umbral(nivel + 1);
  vista.innerHTML = `
    <section class="pagina jardin">
      <header class="jardin-cabeza">
        <p class="sobretitulo">${t('jar_titulo')}</p>
        <h1 class="display">${esc(nombreEtapa(nivel))}</h1>
        <p class="jardin-datos"><span class="tag">${t('jar_nivel', { n: nivel })}</span> <span>${t('jar_prod', { n: J.produccionPorHora(j) })}</span></p>
      </header>
      <div class="seg jardin-tabs" role="tablist">
        <a role="tab" href="#/jardin" aria-selected="${tab === 'jardin'}">${ICON.arbol}<span>${t('jar_tab_jardin')}</span></a>
        <a role="tab" href="#/jardin?t=tienda" aria-selected="${tab === 'tienda'}">${ICON.tienda}<span>${t('jar_tab_tienda')}</span></a>
        <a role="tab" href="#/jardin?t=mundo" aria-selected="${tab === 'mundo'}" id="tab-mundo">${ICON.mapa}<span>${t('jar_tab_mundo')}</span></a>
      </div>
      ${tab === 'tienda' ? htmlTienda() : tab === 'mundo' ? '<div class="mundo" id="mundo"></div>' : `
        <div class="escena-marco" id="escena-marco"><div class="escena" id="escena"></div></div>
        <div class="jardin-crece">
          <span>${t('jar_crece', { n: j.crecimiento - desde, m: hasta - desde })}</span>
          <span class="progreso"><i style="width:${Math.min(100, ((j.crecimiento - desde) / (hasta - desde)) * 100)}%"></i></span>
        </div>
        <div class="jardin-acciones">
          <button class="btn primario grande" type="button" id="j-recoger"></button>
          <button class="btn" type="button" id="j-decorar" aria-pressed="${modoDecorar}">${modoDecorar ? t('jar_listo') : t('jar_decorar')}</button>
        </div>
        <div class="jardin-decorar" id="j-panel" ${modoDecorar ? '' : 'hidden'}></div>
        <p class="suave pequeno jardin-como">${t('jar_como')}</p>`}
    </section>`;
  if (tab === 'tienda') return activarTienda();
  if (tab === 'mundo') return dibujarMundo(r.q.get('e'));
  dibujarEscena();
  pintarRecoger();
  pintarPanelDecorar();
  $('#j-recoger').addEventListener('click', () => {
    const n = J.recoger(S);
    if (!n) return;
    guardar();
    sonido.monedas(Math.min(6, 2 + Math.floor(n / 5)));
    const r0 = $('#j-recoger').getBoundingClientRect();
    estallido(r0.left + r0.width / 2, r0.top, { cantidad: 12 });
    actualizarChips(); pulsoChip();
    pintarRecoger();
  });
  $('#j-decorar').addEventListener('click', () => { modoDecorar = !modoDecorar; vistaJardin(r); });
  clearInterval(vistaJardin.timer);
  vistaJardin.timer = setInterval(() => { if (!$('#j-recoger')) return clearInterval(vistaJardin.timer); pintarRecoger(); }, 30000);
}
function pintarRecoger() {
  const b = $('#j-recoger');
  if (!b) return;
  const n = J.pendiente(S.jardin);
  const lleno = S.jardin.cosecha && Date.now() - S.jardin.cosecha >= J.MAX_HORAS * 3.6e6;
  b.disabled = n === 0;
  b.innerHTML = n ? `<img src="assets/moneda.svg" alt="" width="24" height="24"><span>${t('jar_recoger', { n })}</span>` : `<span>${t('jar_nada')}</span>`;
  b.classList.toggle('lleno', !!lleno && n > 0);
  b.title = lleno ? t('jar_lleno') : '';
}

/** Mundo de sakuras: espacios de 96×96 a escala entera que se recorren deslizando de lado. */
function dibujarMundo(inicial) {
  const caja = $('#mundo');
  if (!caja) return;
  const j = S.jardin;
  const nivel = J.nivelDe(j.crecimiento);
  const abiertos = J.espaciosAbiertos(j);
  const k = Math.max(2, Math.min(5, Math.floor(Math.min(caja.clientWidth, 480) / 96)));
  const cielo = j.fondo;
  const im = (src, x, y, w, h, extra = '', clase = '') => `<img src="${src}" alt="" width="${w * k}" height="${h * k}" class="${clase}" style="left:${x * k}px;top:${y * k}px;${extra}" draggable="false">`;
  const contenido = (e) => {
    if (e.id === 'te') return im(`assets/jardin/fondo-${cielo}.svg`, 0, 0, 96, 96) + im(srcArbol(nivel), 16, 8, 64, 64);
    let h = im(`assets/jardin/${e.id}-${cielo}.svg`, 0, 0, 96, 96);
    if (e.id === 'estanque') h += [[24, 80, 1, 0], [50, 86, 2, 1.8]].map(([x, y, n, r]) => `<button type="button" class="mundo-koi" data-koi style="left:${x * k}px;top:${y * k}px;--r:-${r}s" aria-label="Koi"><img src="assets/jardin/koi-${n}.svg" alt="" width="${12 * k}" height="${6 * k}"></button>`).join('');
    if (e.id === 'faroles') h += J.FAROLES_CALLE.map((f, i) => `<button type="button" class="mundo-farol ${cielo === 'noche' ? 'on' : ''}" data-farol="${i}" aria-pressed="${cielo === 'noche'}" aria-label="${t('mundo_faroles')} ${i + 1}" style="left:${f.x * k}px;top:${f.y * k}px"><img src="assets/jardin/farol-calle${cielo === 'noche' ? '-on' : ''}.svg" alt="" width="${8 * f.e * k}" height="${14 * f.e * k}"></button>`).join('');
    return h;
  };
  caja.style.setProperty('--k', k);
  caja.innerHTML = `
    <div class="mundo-tira" id="mundo-tira" tabindex="0">
      ${J.MUNDO.map((e) => {
        const ok = abiertos.includes(e.id);
        return `<figure class="mundo-espacio ${ok ? '' : 'bloqueado'}" data-espacio="${e.id}" aria-label="${t('mundo_' + e.id)}">
          <div class="mundo-escena escena" style="width:${96 * k}px;height:${96 * k}px">${contenido(e)}
            ${ok ? (e.id === 'estanque' ? im('assets/caras/feliz.svg', 38, 53, 20, 16, '', 'mundo-kitty quieta') : im('assets/caras/feliz.svg', 4, 78, 20, 16, '', 'mundo-kitty')) : `<div class="mundo-candado">${ICON.candado}<span>${t('mundo_bloq', { n: e.nivel })}</span></div>`}
          </div>
          <figcaption><strong>${t('mundo_' + e.id)}</strong><span>${ok ? t('mundo_' + e.id + '_t') : t('mundo_bloq', { n: e.nivel })}</span></figcaption>
        </figure>`;
      }).join('')}
    </div>
    <div class="mundo-nav">
      <button class="icon-btn" type="button" id="mundo-ant" aria-label="${t('mundo_ant')}">${ICON.atras}</button>
      <div class="mundo-puntos">${J.MUNDO.map((e, i) => `<button type="button" data-ir="${i}" aria-label="${t('mundo_ir', { nombre: t('mundo_' + e.id) })}"><i></i></button>`).join('')}</div>
      <button class="icon-btn" type="button" id="mundo-sig" aria-label="${t('mundo_sig')}">${ICON.flecha}</button>
    </div>`;
  const tira = $('#mundo-tira');
  const espacios = $$('.mundo-espacio', tira);
  const actual = () => Math.round(tira.scrollLeft / tira.clientWidth);
  const ir = (i, suave = true) => { i = Math.max(0, Math.min(espacios.length - 1, i)); tira.scrollTo({ left: i * tira.clientWidth, behavior: suave && !sinMovimiento() ? 'smooth' : 'auto' }); };
  const marcar = () => {
    const i = actual();
    $$('.mundo-puntos button').forEach((b, k2) => b.setAttribute('aria-current', String(k2 === i)));
    $('#mundo-ant').disabled = i === 0; $('#mundo-sig').disabled = i === espacios.length - 1;
  };
  tira.addEventListener('scroll', () => { clearTimeout(dibujarMundo.t); dibujarMundo.t = setTimeout(marcar, 80); }, { passive: true });
  tira.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual() - 1); } });
  $('#mundo-ant').addEventListener('click', () => ir(actual() - 1));
  $('#mundo-sig').addEventListener('click', () => ir(actual() + 1));
  $$('.mundo-puntos button').forEach((b) => b.addEventListener('click', () => ir(Number(b.dataset.ir))));
  // Koi: saltan al tocarlos
  $$('[data-koi]', tira).forEach((b) => b.addEventListener('click', () => {
    b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta');
    sonido.moneda(0, 6);
  }));
  // Faroles: se encienden al tocarlos; con todos encendidos, la calle brilla
  $$('[data-farol]', tira).forEach((b) => b.addEventListener('click', () => {
    const on = !b.classList.contains('on');
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    $('img', b).src = `assets/jardin/farol-calle${on ? '-on' : ''}.svg`;
    if (on) sonido.toque();
    const todos = $$('[data-farol]', tira).every((x) => x.classList.contains('on'));
    $('[data-espacio="faroles"]', tira).classList.toggle('brilla', todos);
    if (todos && on) toast(t('mundo_luz'));
  }));
  // Mirador: tocar el paisaje suelta pétalos
  $('[data-espacio="mirador"]:not(.bloqueado) .mundo-escena', tira)?.addEventListener('click', () => { lluvia({ cantidad: 22, monedas: 0 }); sonido.like(); });
  const i0 = Math.max(0, J.MUNDO.findIndex((e) => e.id === inicial));
  requestAnimationFrame(() => { ir(i0, false); marcar(); });
}

/** Escena a escala entera: 96×96 pixeles lógicos × k (3 en celular, 4 en computador). */
function dibujarEscena() {
  const marco = $('#escena-marco');
  const esc0 = $('#escena');
  if (!marco || !esc0) return;
  const j = S.jardin;
  const k = Math.max(2, Math.min(5, Math.floor(marco.clientWidth / J.ESCENA.w)));
  esc0.style.setProperty('--k', k);
  esc0.style.width = esc0.style.height = `${J.ESCENA.w * k}px`;
  esc0.classList.toggle('decorando', modoDecorar);
  if (J.aparecerCaquitas(j)) guardar();
  const nivel = J.nivelDe(j.crecimiento);
  const img = (src, x, y, w, h, extra = '') => `<img src="${src}" alt="" width="${w * k}" height="${h * k}" style="left:${x * k}px;top:${y * k}px;${extra}"`;
  const decor = J.CATALOGO.filter((o) => o.tipo === 'decor' && j.tiene[o.id] && !j.ocultos[o.id]);
  const colgantes = ['chochin', 'furin', 'columpio', 'teru'];
  const petalos = Math.min(18, 2 + nivel + (j.tiene.petalos ? 10 : 0));
  const azar = (i, s) => { const v = Math.sin(i * 91.7 + s * 13.1) * 9999; return v - Math.floor(v); };
  esc0.innerHTML = `
    ${img(`assets/jardin/fondo-${j.fondo}.svg`, 0, 0, 96, 96)} class="escena-fondo">
    ${img(srcArbol(nivel), 16, 8, 64, 64, 'z-index:70')} class="escena-arbol" id="escena-arbol">
    ${decor.map((o) => { const [x, y] = J.posicion(j, o.id); return `${img(`assets/jardin/${o.id}.svg`, x, y, o.w, o.h, `z-index:${colgantes.includes(o.id) ? 150 : y + o.h}`)} class="escena-decor ${['furin', 'teru', 'koinobori'].includes(o.id) ? 'meciendo' : ''} ${j.fondo === 'noche' && ['farol', 'chochin'].includes(o.id) ? 'brilla-noche' : ''}" data-id="${o.id}" draggable="false">`; }).join('')}
    ${img(`assets/caras/${j.caquitas?.length ? 'avergonzada' : 'feliz'}.svg`, 54, 68, 20, 16, 'z-index:84')} class="escena-kitty" id="escena-kitty">
    ${(j.caquitas ?? []).map(([x, y], i) => `<button type="button" class="escena-caquita" data-caquita="${i}" aria-label="${t('caq_label')}" style="left:${(x + J.CAQUITA.w / 2) * k}px;top:${(y + J.CAQUITA.h / 2) * k}px;z-index:${y + J.CAQUITA.h}"><img src="assets/jardin/caquita.svg" alt="" width="${J.CAQUITA.w * k}" height="${J.CAQUITA.h * k}"></button>`).join('')}
    ${Array.from({ length: petalos }, (_, i) => img('assets/jardin/petalo.svg', Math.round(6 + azar(i, 1) * 80), -4, 4, 3,
      `--dur:${(7 + azar(i, 2) * 7).toFixed(1)}s;--retraso:-${(azar(i, 3) * 14).toFixed(1)}s;--vaiven:${Math.round(8 + azar(i, 4) * 16) * k}px;--caida:${100 * k}px;z-index:160`) + ' class="escena-petalo">').join('')}
    ${j.tiene.mariposas ? [0, 1].map((i) => img('assets/jardin/mariposas.svg', 20 + i * 40, 30 + i * 12, 9, 7, `--retraso:-${i * 3}s;z-index:170`) + ' class="escena-mariposa">').join('') : ''}
    ${j.tiene.luciernagas ? Array.from({ length: 7 }, (_, i) => img('assets/jardin/luciernagas.svg', Math.round(8 + azar(i, 5) * 80), Math.round(30 + azar(i, 6) * 50), 5, 5,
      `--retraso:-${(azar(i, 7) * 4).toFixed(1)}s;z-index:165`) + ' class="escena-luciernaga">').join('') : ''}`;
  // Tocar el árbol: se mece y suelta pétalos · tocar a Kitty: dice algo
  $('#escena-arbol').addEventListener('click', (e) => {
    const a = e.currentTarget; a.classList.remove('mece'); void a.offsetWidth; a.classList.add('mece');
    sonido.toque(); estallido(e.clientX, e.clientY, { cantidad: 6 });
  });
  // Caquitas: tocarlas limpia el jardín (+tokens y abono natural)
  $$('[data-caquita]', esc0).forEach((b) => b.addEventListener('click', (e) => {
    const r0 = b.getBoundingClientRect();
    const res = J.limpiarCaquita(S, Number(b.dataset.caquita));
    if (!res) return;
    guardar();
    sonido.monedas(3);
    estallido(r0.left + r0.width / 2, r0.top + r0.height / 2, { cantidad: 10 });
    toast(t('caq_limpia', { n: res.tokens }));
    actualizarChips(); pulsoChip();
    if (res.despues > res.antes) celebrarNivel(res.despues);
    dibujarEscena();
  }));
  let iK = 0;
  $('#escena-kitty').addEventListener('click', (e) => {
    const frases = ['jar_k1', 'jar_k2', 'jar_k3'];
    if (S.jardin.caquitas?.length) return toast(t('caq_k'));
    toast(t(frases[iK++ % frases.length]));
    e.currentTarget.src = cara(['muy_feliz', 'guino', 'enamorada'][iK % 3]);
  });
  if (modoDecorar) $$('.escena-decor', esc0).forEach((el) => activarArrastre(el, k));
}
function activarArrastre(el, k) {
  let x0 = 0, y0 = 0, px = 0, py = 0, activo = false;
  el.addEventListener('pointerdown', (e) => {
    activo = true; el.setPointerCapture(e.pointerId); el.classList.add('arrastrando');
    x0 = e.clientX; y0 = e.clientY; px = parseInt(el.style.left, 10) / k; py = parseInt(el.style.top, 10) / k;
  });
  el.addEventListener('pointermove', (e) => {
    if (!activo) return;
    const o = J.objeto(el.dataset.id);
    const x = Math.max(0, Math.min(J.ESCENA.w - o.w, Math.round(px + (e.clientX - x0) / k)));
    const y = Math.max(0, Math.min(J.ESCENA.h - o.h, Math.round(py + (e.clientY - y0) / k)));
    el.style.left = `${x * k}px`; el.style.top = `${y * k}px`;
  });
  const soltar = () => {
    if (!activo) return;
    activo = false; el.classList.remove('arrastrando');
    J.mover(S.jardin, el.dataset.id, parseInt(el.style.left, 10) / k, parseInt(el.style.top, 10) / k);
    guardar(); sonido.toque();
    dibujarEscena();
  };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
}
function pintarPanelDecorar() {
  const p = $('#j-panel');
  if (!p || !modoDecorar) return;
  const j = S.jardin;
  const decor = J.CATALOGO.filter((o) => o.tipo === 'decor' && j.tiene[o.id]);
  const fondos = J.FONDOS.filter((f) => f === 'dia' || j.tiene[f]);
  p.innerHTML = `
    <p class="suave pequeno">${t('jar_arrastra')}</p>
    ${fondos.length > 1 ? `<p class="etiqueta">${t('jar_fondo')}</p><div class="seg" role="radiogroup" aria-label="${t('jar_fondo')}">
      ${fondos.map((f) => `<button type="button" role="radio" aria-checked="${j.fondo === f}" data-fondo="${f}">${f === 'dia' ? t('jar_fondo_dia') : nombreObjeto(f)}</button>`).join('')}</div>` : ''}
    ${decor.length ? `<div class="decor-lista">${decor.map((o) => `<button type="button" class="decor-chip" data-ver="${o.id}" aria-pressed="${!j.ocultos[o.id]}">
      <img src="assets/jardin/${o.id}.svg" alt="" width="${o.w * (o.h > 14 ? 1 : 2)}" height="${o.h * (o.h > 14 ? 1 : 2)}"><span>${esc(nombreObjeto(o.id))}</span></button>`).join('')}</div>`
      : `<p>${t('jar_sin_decor')} <a href="#/jardin?t=tienda">${t('jar_tab_tienda')}</a></p>`}`;
  $$('[data-fondo]', p).forEach((b) => b.addEventListener('click', () => { j.fondo = b.dataset.fondo; guardar(); dibujarEscena(); pintarPanelDecorar(); }));
  $$('[data-ver]', p).forEach((b) => b.addEventListener('click', () => { J.alternarVisible(j, b.dataset.ver); guardar(); dibujarEscena(); pintarPanelDecorar(); }));
}

const SECCIONES_TIENDA = ['abono', 'decor', 'ambiente', 'fondo', 'especial'];
function htmlTienda() {
  const j = S.jardin;
  const tarjeta = (o) => {
    const motivo = J.motivoNoCompra(S, o.id);
    const k = o.w <= 9 ? 4 : o.w <= 16 ? 3 : 2;
    const boton = motivo === 'tienes' ? `<span class="tienda-tienes">${ICON.check}${t('tienda_tienes')}</span>`
      : motivo === 'max' ? `<span class="tienda-tienes">${t('tienda_max')}</span>`
        : `<button class="btn ${motivo ? '' : 'primario'} tienda-comprar" type="button" data-comprar="${o.id}" ${motivo ? 'aria-disabled="true"' : ''}>
            <img src="assets/moneda.svg" alt="" width="24" height="24"><span>${o.precio}</span></button>
           ${motivo === 'monedas' ? `<small class="suave">${t('tienda_faltan', { n: o.precio - S.tokens })}</small>` : ''}`;
    return `<li class="tienda-item ${motivo === 'tienes' ? 'tenido' : ''}">
      <span class="tienda-icono"><img src="assets/jardin/${o.id}.svg" alt="" width="${o.w * k}" height="${o.h * k}"></span>
      <span class="tienda-txt"><strong>${esc(nombreObjeto(o.id))}</strong><small>${esc(t(`itd_${o.id.replace(/-/g, '_')}`))}</small>
        ${o.tipo === 'especial' ? `<small class="tag">${t('tienda_reservas', { n: j.protectores })}</small>` : ''}</span>
      <span class="tienda-precio">${boton}</span>
    </li>`;
  };
  return `<div class="tienda">
    <p class="tienda-saldo"><img src="assets/moneda.svg" alt="" width="24" height="24"><strong>${S.tokens}</strong> <span class="suave">Kitty tokens</span>
      <img src="assets/diamante.svg" alt="" width="25" height="19"><strong id="saldo-diamantes">${S.diamantes ?? 0}</strong> <span class="suave">${t('dia_titulo')}</span></p>
    <div class="card tienda-diamantes">
      <img src="assets/diamante.svg" alt="" width="75" height="57">
      ${S.diamantes ? `<button class="btn primario" type="button" id="cambiar-diamante">${t('dia_cambiar', { n: store.DIAMANTE_TOKENS })}</button>` : `<p class="suave pequeno">${t('dia_sin')}</p>`}
    </div>
    ${SECCIONES_TIENDA.map((sec) => `<h2 class="tienda-seccion">${t(`tienda_${sec}`)}</h2>
      <ul class="tienda-lista">${J.CATALOGO.filter((o) => o.tipo === sec).map(tarjeta).join('')}</ul>`).join('')}
  </div>`;
}
function activarTienda() {
  $('#cambiar-diamante')?.addEventListener('click', () => {
    if (!store.cambiarDiamante(S)) return;
    guardar(); sonido.brillo(); sonido.monedas(4);
    toast(t('dia_cambiado', { n: store.DIAMANTE_TOKENS }));
    actualizarChips(); pulsoChip();
    vistaJardin({ q: new URLSearchParams('t=tienda') });
  });
  $$('[data-comprar]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.comprar;
    const res = J.comprar(S, id);
    if (!res.ok) { sonido.quitar(); b.classList.remove('niega'); void b.offsetWidth; b.classList.add('niega'); return; }
    guardar();
    sonido.monedas(3);
    const r0 = b.getBoundingClientRect();
    estallido(r0.left + r0.width / 2, r0.top + r0.height / 2, { cantidad: 10 });
    toast(t('tienda_comprado', { nombre: nombreObjeto(id) }));
    actualizarChips();
    const y = scrollY;
    vistaJardin({ q: new URLSearchParams('t=tienda') });
    scrollTo(0, y);
    if (res.despues > res.antes) setTimeout(() => celebrarNivel(res.despues), 350);
  }));
}
addEventListener('resize', () => { if (document.body.dataset.ruta === 'jardin') dibujarEscena(); });
