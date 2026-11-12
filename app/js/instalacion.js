// ---------- Instalar la app en la pantalla de inicio ----------
// Chrome/Edge/Android avisan con «beforeinstallprompt» y se instala con un toque.
// iPhone/iPad (Safari) y otros navegadores no tienen ese aviso: se muestran los pasos.
import { t } from './i18n.js';
import { ICON } from './iconos.js';
import { sonido } from './sonido.js';
import { lluvia } from './adornos.js';
import { $, $$, toast, modal } from './ui.js';

let avisoInstalar = null;
export const instalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); avisoInstalar = e; });
addEventListener('appinstalled', () => { avisoInstalar = null; toast(t('inst_lista')); $$('.btn-instalar').forEach((b) => b.remove()); $('#aviso-descarga')?.remove(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// Navegadores dentro de otras apps (Instagram, TikTok, Facebook…): ahí no se puede instalar.
const enOtraApp = () => /Instagram|FBAN|FBAV|FB_IAB|musical_ly|TikTok|Bytedance|Line\/|Snapchat|LinkedInApp|Twitter/i.test(navigator.userAgent);

// Aviso grande «Descarga la app»: aparece abajo mientras no esté instalada (se puede cerrar por 3 días).
const CLAVE_AVISO = 'franui:aviso-descarga';
export function avisoDescarga(ruta) {
  $('#aviso-descarga')?.remove();
  document.body.classList.remove('con-aviso-descarga');
  if (instalada() || ['estudiar', 'instalar'].includes(ruta)) return;
  let cerrado = 0;
  try { cerrado = Number(localStorage.getItem(CLAVE_AVISO)) || 0; } catch { /* sin almacenamiento */ }
  if (Date.now() - cerrado < 3 * 864e5) return;
  const el = document.createElement('div');
  el.id = 'aviso-descarga'; el.className = 'aviso-descarga'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', t('inst_boton'));
  el.innerHTML = `
    <img src="assets/app/icono-192.png" alt="" width="52" height="52">
    <div class="aviso-txt"><strong>${t('inst_aviso_titulo')}</strong><small>${t('inst_aviso_sub')}</small></div>
    <button class="btn primario btn-instalar" type="button">${ICON.descargar}<span>${t('inst_aviso_boton')}</span></button>
    <button class="icon-btn aviso-cerrar" type="button" aria-label="${t('inst_aviso_cerrar')}">${ICON.cerrar}</button>`;
  $('.aviso-cerrar', el).addEventListener('click', () => {
    try { localStorage.setItem(CLAVE_AVISO, String(Date.now())); } catch { /* sin almacenamiento */ }
    el.remove(); document.body.classList.remove('con-aviso-descarga');
  });
  document.body.append(el);
  document.body.classList.add('con-aviso-descarga');
}

export const iconoApp = () => '<span class="icono-app" aria-hidden="true"><img src="assets/app/icono-192.png" alt="" width="96" height="96"></span>';
export async function instalarApp() {
  if (instalada()) return void toast(t('inst_ya'));
  if (avisoInstalar) {
    avisoInstalar.prompt();
    const { outcome } = await avisoInstalar.userChoice.catch(() => ({}));
    avisoInstalar = null;
    if (outcome === 'accepted') { sonido.premio(); lluvia({ cantidad: 24 }); }
    return;
  }
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /android/i.test(ua);
  const pasos = enOtraApp() ? ['inst_otra_1', 'inst_otra_2', 'inst_otra_3'] : ios ? ['inst_ios_1', 'inst_ios_2', 'inst_ios_3'] : android ? ['inst_and_1', 'inst_and_2', 'inst_and_3'] : ['inst_pc_1', 'inst_pc_2'];
  modal(t('inst_titulo'), `
    <div class="instalar">
      ${iconoApp()}
      <p class="suave">${t('inst_texto')}</p>
      <ol class="pasos-instalar">${pasos.map((k) => `<li>${t(k)}</li>`).join('')}</ol>
    </div>`);
}
export const botonInstalar = (clase = 'menu-instalar') => (instalada() ? '' :
  `<button class="btn-instalar ${clase}" type="button">${ICON.descargar}<span>${t('inst_boton')}</span></button>`);
document.addEventListener('click', (e) => { if (e.target.closest('.btn-instalar')) instalarApp(); });
