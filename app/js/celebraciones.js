// Polykat — celebraciones a pantalla completa: racha, cofre, palabra dominada, diamantes y premio de tragamonedas.
import { t, tn } from './i18n.js';
import * as store from './store.js';
import { dificultad } from './srs.js';
import * as banco from './banco.js';
import { sonido } from './sonido.js';
import { estallido, lluvia } from './adornos.js';
import { $, esc, cara, toast, sinMovimiento } from './ui.js';
import { S, sesion, guardar } from './estado.js';
import { actualizarChips, pulsoChip } from './marco.js';

/** Primer estudio del día: la racha sube con una lluvia de sakuras; cada 7 días, un cofre. */
/** Racha del día cumplida (20 palabras): Kitty baila a pantalla completa; después, el cofre si toca. */
export function celebrarRacha() {
  if (document.querySelector('.premio-capa')) return setTimeout(celebrarRacha, 400); // espera a que se cobre el premio
  const n = store.rachaVigente(S.racha);
  pulsoChip();
  const cofre = store.abrirCofre(S);
  if (cofre) guardar();
  bailarKitty(n, () => { if (cofre) setTimeout(() => mostrarCofre(cofre), 300); });
}
function bailarKitty(n, alCerrar) {
  document.querySelector('.baile-capa')?.remove();
  const capa = document.createElement('div');
  capa.className = 'baile-capa'; capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true'); capa.setAttribute('aria-labelledby', 'baile-titulo');
  capa.innerHTML = `<div class="baile">
      <div class="baile-pista" aria-hidden="true">
        <span class="baile-nota n1">♪</span><span class="baile-nota n2">♫</span><span class="baile-nota n3">♪</span>
        <img class="baile-kitty" id="baile-kitty" src="${cara('celebrando')}" alt="" width="160" height="128">
        <span class="baile-sombra"></span>
      </div>
      <h2 class="baile-titulo" id="baile-titulo">${t('baile_titulo')}</h2>
      <p class="baile-racha"><img src="assets/sakura.svg" alt="" width="46" height="46"><strong>${tn('baile_dias_n', n)}</strong></p>
      <p>${t('baile_texto')}</p>
      <button class="btn primario grande" type="button" id="baile-ok">${t('baile_ok')}</button>
    </div>`;
  document.body.append(capa);
  sonido.fin();
  lluvia({ cantidad: 40, monedas: 0.3, dur: 3200 });
  // Kitty cambia de cara al ritmo del baile
  const caras = ['celebrando', 'muy_feliz', 'guino', 'enamorada'];
  let i = 0;
  const ritmo = sinMovimiento() ? null : setInterval(() => { const k = $('#baile-kitty'); if (!k) return clearInterval(ritmo); k.src = cara(caras[++i % caras.length]); }, 450);
  const cerrar = () => { clearInterval(ritmo); capa.remove(); alCerrar?.(); };
  $('#baile-ok').addEventListener('click', cerrar);
  capa.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  $('#baile-ok').focus();
}
/** Cofre: se sacude, se abre al tocarlo y suelta monedas. */
function mostrarCofre({ dias, monedas }) {
  document.querySelector('.cofre-capa')?.remove();
  const capa = document.createElement('div');
  capa.className = 'premio-capa cofre-capa';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-labelledby', 'cofre-titulo');
  capa.innerHTML = `
    <div class="premio-caja">
      <p class="premio-titulo" id="cofre-titulo">${t('cofre_titulo')}</p>
      <p class="premio-texto">${t('cofre_texto', { n: dias })}</p>
      <button class="cofre-boton" type="button" id="cofre-abrir" aria-label="${t('cofre_abrir')}">
        <img src="assets/cofre.svg" alt="" width="120" height="100">
      </button>
      <p class="premio-monto" hidden id="cofre-monto"><img src="assets/moneda.svg" alt="" width="48" height="48"><span>+${monedas}</span></p>
      <button class="btn primario grande" type="button" id="cofre-ok">${t('cofre_abrir')}</button>
    </div>`;
  document.body.append(capa);
  let abierto = false;
  const cerrar = () => { capa.classList.add('saliendo'); setTimeout(() => capa.remove(), 300); actualizarChips(); pulsoChip(); };
  const abrir = () => {
    if (abierto) return cerrar();
    abierto = true;
    const b = $('#cofre-abrir', capa);
    b.classList.add('abierto');
    $('img', b).src = 'assets/cofre-abierto.svg';
    $('#cofre-monto', capa).hidden = false;
    $('#cofre-ok', capa).textContent = t('premio_ok');
    sonido.premio();
    const r = b.getBoundingClientRect();
    estallido(r.left + r.width / 2, r.top + r.height / 3, { cantidad: 16 });
    lluvia({ cantidad: 24, monedas: 0.8 });
  };
  $('#cofre-abrir', capa).addEventListener('click', abrir);
  $('#cofre-ok', capa).addEventListener('click', abrir);
  capa.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  $('#cofre-ok', capa).focus({ preventScroll: true });
}

/** Monedas que vuelan de la tarjeta al contador de arriba. */
export function volarMonedas(origen, n = 1) {
  const destino = $('#chip-tokens .moneda');
  if (!destino || sinMovimiento()) return;
  const a = $('.tarjeta', origen)?.getBoundingClientRect() ?? origen.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const m = document.createElement('img');
    m.src = 'assets/moneda.svg'; m.alt = ''; m.width = 24; m.height = 24; m.className = 'moneda-vuela';
    const x0 = a.left + a.width / 2 - 12 + (Math.random() - 0.5) * 80;
    const y0 = a.top + a.height * 0.45 - 12 + (Math.random() - 0.5) * 50;
    m.style.left = `${x0}px`; m.style.top = `${y0}px`;
    document.body.append(m);
    const dx = b.left - x0, dy = b.top - y0;
    m.animate([
      { transform: 'translate(0, 0) scale(.4) rotate(0)', opacity: 0 },
      { transform: `translate(${dx * 0.25}px, ${dy * 0.25 - 60}px) scale(1.5) rotate(180deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(.9) rotate(540deg)`, opacity: 1 },
    ], { duration: 720, delay: i * 90, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'forwards' })
      .finished.then(() => { m.remove(); pulsoChip(); }).catch(() => m.remove());
  }
}

/** Pantalla «¡Dominada!» (como el match de Tinder): la palabra y su traducción chocan y Kitty celebra. */
export function mostrarDominada(id, meta) {
  document.querySelector('.dominada-capa')?.remove();
  const nativo = S.ajustes.nativo;
  const palabra = banco.texto(meta, id)?.texto ?? '', trad = banco.texto(nativo, id)?.texto ?? '';
  const total = Object.values(store.progresoDe(S, meta)).filter((e) => dificultad(e) === 'dominada').length;
  const capa = document.createElement('div');
  capa.className = 'dominada-capa'; capa.setAttribute('role', 'dialog'); capa.setAttribute('aria-modal', 'true'); capa.setAttribute('aria-labelledby', 'dom-titulo');
  capa.innerHTML = `<div class="dominada">
      <h2 id="dom-titulo" class="dominada-titulo">${t('dom_titulo')}</h2>
      <div class="dominada-par" aria-hidden="true">
        <span class="dominada-burbuja izq" lang="${meta}">${esc(palabra)}</span>
        <img class="dominada-kitty" src="${cara('orgullosa')}" alt="" width="100" height="80">
        <span class="dominada-burbuja der" lang="${nativo}">${esc(trad)}</span>
      </div>
      <p>${t('dom_texto', { palabra: esc(palabra) })}</p>
      <p class="dominada-bono"><img src="assets/moneda.svg" alt="" width="24" height="24">${t('dom_bono', { n: store.BONO_DOMINADA })}</p>
      <small>${t('dom_total', { n: total })}</small>
      <button class="btn primario grande" type="button" id="dom-seguir">${t('dom_seguir')}</button>
    </div>`;
  document.body.append(capa);
  sonido.like();
  lluvia({ cantidad: 30, monedas: 0.4 });
  const cerrar = () => { capa.remove(); actualizarChips(); };
  $('#dom-seguir').addEventListener('click', cerrar);
  capa.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  $('#dom-seguir').focus();
}

/** Diamante sorpresa: cruza la pantalla unos segundos; si lo tocas a tiempo, es tuyo. */
export function aparecerDiamante() {
  if (!sesion || document.querySelector('.diamante-vuela')) return;
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'diamante-vuela'; b.setAttribute('aria-label', t('dia_atrapa'));
  b.innerHTML = '<img src="assets/diamante.svg" alt="" width="75" height="57">';
  b.style.top = `${18 + Math.random() * 50}vh`;
  b.style.setProperty('--dir', Math.random() < 0.5 ? 1 : -1);
  document.body.append(b);
  sonido.toque();
  const fuera = setTimeout(() => b.remove(), 3600);
  b.addEventListener('click', (e) => {
    clearTimeout(fuera);
    const r0 = b.getBoundingClientRect();
    b.remove();
    estallido(r0.left + r0.width / 2, r0.top + r0.height / 2, { cantidad: 14 });
    store.ganarDiamante(S);
    guardar();
    celebrarDiamante(t('dia_ganado'));
  });
}
export function celebrarDiamante(texto) {
  sonido.brillo();
  toast(texto);
  if (sinMovimiento()) return;
  const d = document.createElement('img');
  d.src = 'assets/diamante.svg'; d.alt = ''; d.width = 125; d.height = 95; d.className = 'diamante-gana';
  document.body.append(d);
  setTimeout(() => d.remove(), 1600);
}

/** Ventana de premio estilo tragamonedas: 3 rodillos que se detienen en monedas y lluvia de monedas. */
const SIMBOLOS = [['moneda', 48, 48], ['sakura', 46, 46], ['estrella', 42, 42], ['cerezas', 36, 34], ['corazon', 39, 36]];
export function mostrarPremio(p) {
  document.querySelector('.premio-capa')?.remove();
  const tira = () => {
    const celdas = Array.from({ length: 14 }, () => SIMBOLOS[1 + Math.floor(Math.random() * 4)]);
    celdas.push(SIMBOLOS[0]);
    return celdas.map(([n, w, h]) => `<span class="celda-rodillo"><img src="assets/${n}.svg" alt="" width="${w}" height="${h}"></span>`).join('');
  };
  const capa = document.createElement('div');
  capa.className = 'premio-capa';
  capa.setAttribute('role', 'dialog');
  capa.setAttribute('aria-modal', 'true');
  capa.setAttribute('aria-labelledby', 'premio-titulo');
  capa.innerHTML = `
    <div class="premio-caja">
      <p class="premio-titulo" id="premio-titulo">${t('premio_titulo')}</p>
      <div class="rodillos" aria-hidden="true">${[0, 1, 2].map((i) => `<div class="rodillo"><div class="tira" style="--i:${i}">${tira()}</div></div>`).join('')}</div>
      <p class="premio-monto"><img src="assets/moneda.svg" alt="" width="48" height="48"><span id="premio-num" aria-live="polite">+${p.monedas}</span></p>
      <p class="premio-texto">${t('premio_texto', { n: p.revisadas })}</p>
      <p class="suave">${t('premio_siguiente', { n: p.revisadas + store.PREMIO_CADA, m: p.siguiente })}</p>
      <button class="btn primario grande" type="button" id="premio-ok">${t('premio_ok')}</button>
    </div>
    <div class="lluvia-monedas" aria-hidden="true"></div>`;
  document.body.append(capa);
  const cerrar = () => { capa.classList.add('saliendo'); setTimeout(() => capa.remove(), 300); actualizarChips(); pulsoChip(); };
  $('#premio-ok', capa).addEventListener('click', () => { sonido.monedas(4); cerrar(); });
  capa.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
  $('#premio-ok', capa).focus({ preventScroll: true });
  if (sinMovimiento()) { sonido.premio(); return; }
  sonido.rodillos(1.5);
  [0.9, 1.2, 1.5].forEach((t0) => sonido.tope(t0));
  const num = $('#premio-num', capa);
  num.textContent = '+0';
  setTimeout(() => {
    sonido.premio();
    capa.classList.add('ganado');
    const inicio = performance.now();
    const contar = (ahora) => {
      const k = Math.min(1, (ahora - inicio) / 900);
      num.textContent = `+${Math.round(p.monedas * k)}`;
      if (k < 1) requestAnimationFrame(contar);
    };
    requestAnimationFrame(contar);
    $('.lluvia-monedas', capa).innerHTML = Array.from({ length: 28 }, (_, i) =>
      `<img src="assets/moneda.svg" alt="" width="24" height="24" style="--x:${Math.random() * 100}%;--d:${(Math.random() * 0.9).toFixed(2)}s;--r:${Math.round(Math.random() * 720)}deg;--i:${i}">`).join('');
  }, 1600);
}
