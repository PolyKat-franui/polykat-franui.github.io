// Polykat — estado de la app: el avance (S), el guardado automático, la cuenta de Google y los ajustes visuales.
// S se importa «en vivo»: si se reemplaza con setS(), todos los módulos ven el nuevo.
import './traspaso.js'; // primero: puede traer el avance desde la dirección antigua
import { t, setIdiomaUI, cargarIdiomaUI, idiomaCargado, IDIOMAS_UI } from './i18n.js';
import * as store from './store.js';
import { activarSonido } from './sonido.js';
import * as nube from './nube.js';
import * as J from './jardin.js';
import * as rec from './recordatorio.js';
import { $, toast, router, ir } from './ui.js';

export let S = store.cargar();
/** Reemplaza todo el avance (elegir qué avance conservar, borrar todo). */
export function setS(nuevo) { S = nuevo; }

/** Sesión de estudio en curso (la arma pantallas/estudiar.js); null fuera de ella. */
export let sesion = null;
export function setSesion(nueva) { sesion = nueva; }

// ---------- Guardado automático ----------
let timerGuardar = null;
export function guardar() {
  clearTimeout(timerGuardar);
  timerGuardar = setTimeout(() => { store.guardar(S); subirPronto(); publicarRecordatorio(); }, 150);
}
/** Le cuenta al service worker si hoy ya estudiaste (para no avisar de más). */
function publicarRecordatorio() {
  const a = S.ajustes;
  if (!a.recordatorio) return;
  rec.publicarEstado({ activo: true, hora: a.horaRecordatorio, ultimoDiaEstudio: S.racha.ultimoDia, titulo: t('rec_noti_titulo'), texto: t('rec_noti_texto') }).catch(() => {});
}
export const guardarYa = () => { clearTimeout(timerGuardar); store.guardar(S); subirYa(); };

// ---------- Nube (cuenta de Google) ----------
// Con cuenta, cada cambio se sube unos segundos después (y al cerrar o esconder la app).
// Solo se sube si hay cambios sin enviar: así un celular olvidado abierto no pisa lo estudiado en otro.
let timerNube = null;
let sinSubir = false;
export let cuentaPendiente = null; // avance de la nube que espera la pantalla «¿Qué avance conservo?»
export function setCuentaPendiente(avance) { cuentaPendiente = avance; }
export const conCuenta = () => S.perfil.cuenta?.tipo === 'google' && nube.nubeLista();
export function subirYa(forzar = false) {
  clearTimeout(timerNube);
  if (!conCuenta() || (!sinSubir && !forzar)) return;
  sinSubir = false;
  nube.guardarAvance(S.perfil.cuenta.uid, S).catch(() => { sinSubir = true; });
  publicarMiRanking();
}
/** Fila pública del ranking: solo nombre y números (nunca el correo). Se puede apagar en Ajustes. */
export const filaRanking = () => ({
  nombre: (S.perfil.nombre || S.perfil.cuenta?.nombre?.split(' ')[0] || 'Polyglot').trim().slice(0, 30),
  racha: store.rachaVigente(S.racha),
  dia: S.racha.ultimoDia || '',
  palabras: store.resumen(S).palabras,
  nivel: J.nivelDe(S.jardin.crecimiento),
  actualizado: Date.now(),
  liga: S.liga.nivel,
  semana: S.liga.semana || store.semanaISO(),
  xp: S.liga.semana === store.semanaISO() ? S.liga.xp : 0,
});
export function publicarMiRanking() {
  if (!conCuenta() || S.ajustes.ranking === false) return;
  nube.publicarRanking(S.perfil.cuenta.uid, filaRanking()).catch((e) => console.warn('ranking:', e?.code || e));
}
function subirPronto() {
  if (!conCuenta() || cuentaPendiente) return;
  sinSubir = true;
  clearTimeout(timerNube);
  timerNube = setTimeout(subirYa, 4000);
}
/** Une el avance de la nube con el del navegador según store.decidirAlEntrar. Devuelve la acción. */
function sincronizar(remota, cuenta) {
  const accion = store.decidirAlEntrar(remota, S);
  if (accion === 'bajar') {
    const perfil = { ...S.perfil }, nativo = S.ajustes.nativo;
    S = store.normalizar(remota);
    S.perfil = { ...S.perfil, ...perfil, cuenta };
    S.ajustes.nativo ||= nativo;
    aplicarAjustes();
  } else if (accion === 'preguntar') {
    cuentaPendiente = store.normalizar(remota);
  }
  S.perfil.cuenta = cuenta;
  store.guardar(S);
  if (accion === 'subir') subirYa(true);
  return accion;
}
/** Botón «Entrar con Google» (portada y Ajustes). */
export async function conectarGoogle() {
  if (!nube.nubeLista()) return void toast(t('login_pronto'));
  try {
    const cuenta = await nube.entrarConGoogle();
    const remota = await nube.leerAvance(cuenta.uid);
    S.perfil.elegido = true;
    if (!S.perfil.nombre && cuenta.nombre) S.perfil.nombre = cuenta.nombre.split(' ')[0];
    const accion = sincronizar(remota, cuenta);
    toast(t('nube_conectada', { email: cuenta.email }));
    if (accion === 'preguntar') return void ir('#/conservar');
    ir(S.aprendiendo ? '#/menu' : '#/idiomas');
  } catch (e) {
    if (e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') return;
    toast(t('nube_error'));
  }
}
export async function salirDeGoogle() {
  try { subirYa(); await nube.salir(); } catch { /* sin conexión: igual se cierra aquí */ }
  S.perfil.cuenta = null;
  guardar();
  toast(t('nube_salio'));
  router();
}
/** Al abrir la app con cuenta: trae lo más nuevo de la nube (p. ej. lo que estudiaste en otro celular). */
export async function sincronizarAlAbrir() {
  if (!conCuenta()) return;
  try {
    const cuenta = await nube.sesionActual();
    if (!cuenta) { S.perfil.cuenta = null; guardar(); return; }
    const accion = sincronizar(await nube.leerAvance(cuenta.uid), cuenta);
    if (accion === 'preguntar') ir('#/conservar');
    else if (accion === 'bajar') router();
    // Cada vez que se abre la app con cuenta se actualiza la fila del ranking:
    // así aparece también quien entró con Google pero cerró antes de que se publicara.
    if (accion !== 'preguntar') publicarMiRanking();
  } catch { /* sin conexión: se sigue con el avance de este navegador */ }
}
addEventListener('pagehide', guardarYa);
document.addEventListener('visibilitychange', () => { if (document.hidden) guardarYa(); });

// ---------- Ajustes visuales ----------
export function aplicarAjustes() {
  const a = S.ajustes;
  const root = document.documentElement;
  if (a.tema === 'sistema') root.removeAttribute('data-theme');
  else root.dataset.theme = a.tema === 'oscuro' ? 'dark' : 'light';
  root.dataset.paleta = a.paleta;
  activarSonido(a.sonido);
  root.style.setProperty('--escala', a.escala);
  $('#capa-brillo').style.opacity = String(Math.max(0, 1 - a.brillo));
  root.lang = a.nativo;
  setIdiomaUI(a.nativo);
  // Si los textos de ese idioma aún no están descargados (p. ej. llegó un avance de la nube), se bajan y se repinta.
  if (!idiomaCargado(a.nativo)) cargarIdiomaUI(a.nativo).then(() => { if (idiomaCargado(a.nativo)) { setIdiomaUI(a.nativo); router(); } });
}

export function nativoInicial() {
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return IDIOMAS_UI.includes(nav) ? nav : 'es';
}
