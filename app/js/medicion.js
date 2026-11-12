// Medición anónima de uso: cuántas personas vuelven al día 1, 7 y 30.
// Decisión de Francisca (2026-11-12): se mide a todas las personas con un código anónimo al azar
// que vive solo en este celular (no es la cuenta de Google ni el nombre), y se puede apagar en Ajustes.
// En la nube solo queda: el día en que empezó, los días en que abrió la app y cuántas sesiones terminó.
import * as nube from './nube.js';

export const CLAVE = 'franui:medicion';

/** Fecha local como 'AAAA-MM-DD'. */
export const diaDe = (ms = Date.now()) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Código anónimo al azar (no deriva de nada de la persona). */
export function codigoAzar() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const h = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${h()}${h()}-${h()}-${h()}-${h()}-${h()}${h()}${h()}`;
}

/** Registro local: { id, desde, activa, ultimo }. Lo crea la primera vez. */
export function leerRegistro(almacen = globalThis.localStorage, ahora = Date.now()) {
  let r = null;
  try { r = JSON.parse(almacen?.getItem(CLAVE) || 'null'); } catch { r = null; }
  if (!r || typeof r.id !== 'string') r = { id: codigoAzar(), desde: diaDe(ahora), activa: true, ultimo: null };
  try { almacen?.setItem(CLAVE, JSON.stringify(r)); } catch { /* sin almacenamiento: no se mide */ }
  return r;
}

function guardarRegistro(r, almacen = globalThis.localStorage) {
  try { almacen?.setItem(CLAVE, JSON.stringify(r)); } catch { /* nada */ }
}

/** ¿Hay que avisar a la nube la visita de hoy? (como máximo una vez al día). */
export const debeRegistrarVisita = (r, hoy) => !!r && r.activa !== false && r.ultimo !== hoy;

export const medicionActiva = () => leerRegistro().activa !== false;

/** Encender o apagar la medición (desde Ajustes). */
export function cambiarMedicion(activa) {
  const r = leerRegistro();
  r.activa = !!activa;
  guardarRegistro(r);
}

/** Avisa que hoy se abrió la app. No falla nunca: si no hay nube o internet, se reintenta otro día. */
export async function registrarVisita(ahora = Date.now()) {
  const r = leerRegistro(undefined, ahora);
  const hoy = diaDe(ahora);
  if (!debeRegistrarVisita(r, hoy) || !nube.nubeLista()) return false;
  try {
    await nube.registrarUso(r.id, { primer: r.desde, dia: hoy, sesiones: 0 });
    r.ultimo = hoy;
    guardarRegistro(r);
    return true;
  } catch { return false; }
}

/** Suma una sesión terminada al día de hoy. */
export async function contarSesion(ahora = Date.now()) {
  const r = leerRegistro(undefined, ahora);
  if (r.activa === false || !nube.nubeLista()) return false;
  try { await nube.registrarUso(r.id, { primer: r.desde, dia: diaDe(ahora), sesiones: 1 }); return true; } catch { return false; }
}

// ---------- Resumen para la creadora ----------
const MS_DIA = 86400000;
const aMs = (dia) => { const [a, m, d] = dia.split('-').map(Number); return Date.UTC(a, m - 1, d); };
const diasEntre = (a, b) => Math.round((aMs(b) - aMs(a)) / MS_DIA);

/**
 * Retorno de las personas medidas. dN = de quienes empezaron hace N días o más,
 * qué parte volvió a abrir la app el día N o después (retorno «al día N o más tarde»).
 * docs = [{ primer, dias: ['AAAA-MM-DD', ...], sesiones }]
 */
export function resumenRetorno(docs, hoy = diaDe()) {
  const validos = docs.filter((x) => typeof x?.primer === 'string' && Array.isArray(x.dias));
  const tasa = (n) => {
    const base = validos.filter((x) => diasEntre(x.primer, hoy) >= n);
    if (!base.length) return null;
    const volvieron = base.filter((x) => x.dias.some((d) => diasEntre(x.primer, d) >= n)).length;
    return { volvieron, de: base.length, pct: Math.round((volvieron / base.length) * 100) };
  };
  const activasSemana = validos.filter((x) => x.dias.some((d) => { const k = diasEntre(d, hoy); return k >= 0 && k < 7; })).length;
  const sesiones = validos.reduce((s, x) => s + (Number.isInteger(x.sesiones) ? x.sesiones : 0), 0);
  return { personas: validos.length, activasSemana, sesiones, d1: tasa(1), d7: tasa(7), d30: tasa(30) };
}
