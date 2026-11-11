// Palabra del día: la misma palabra para toda la comunidad Polykat cada día, en los 6 idiomas.
// Lógica pura (sin DOM) para poder probarla: tests/palabra-dia.test.mjs.
import { diaLocal } from './store.js';

/** Idiomas en los que se muestra (en este orden). */
export const IDIOMAS_PALABRA = ['en', 'es', 'pt', 'fr', 'it', 'de'];

const TIPOS = new Set(['sustantivo', 'verbo', 'adjetivo', 'adverbio']);

/**
 * Palabras que pueden salir: sustantivos, verbos, adjetivos y adverbios (no frases ni nombres propios)
 * que tienen oración de ejemplo. Solo usa datos iguales para todas las personas (el banco y los
 * ejemplos en inglés), así todas ven la misma palabra el mismo día, aprendan el idioma que aprendan.
 */
export function candidatos(conceptos, ejemplosEn) {
  return conceptos
    .filter((c) => ejemplosEn?.[c.id] && c.tipos.some((t) => TIPOS.has(t))
      && !c.tipos.includes('frase') && !c.tipos.includes('nombre propio'))
    .map((c) => c.id)
    .sort();
}

/** Número de día desde 1970 para «AAAA-MM-DD» (sin depender de la zona horaria). */
export function numeroDia(dia) {
  const [a, m, d] = dia.split('-').map(Number);
  return Math.floor(Date.UTC(a, m - 1, d) / 86400000);
}

const mcd = (a, b) => (b ? mcd(b, a % b) : a);

/**
 * Id de la palabra del día. Recorre la lista con un salto fijo que no comparte divisores con su
 * largo: así no se repite ninguna palabra hasta haber pasado por todas, y días seguidos no caen
 * en palabras vecinas (del mismo tema).
 */
export function palabraDelDia(dia, lista) {
  const n = lista.length;
  if (!n) return null;
  let salto = 7919 % n || 1;
  while (mcd(salto, n) !== 1) salto++;
  return lista[(((numeroDia(dia) * salto) % n) + n) % n];
}

/** ¿Ya vio la palabra de hoy? (para el punto de «nueva» en el menú) */
export const vistaHoy = (estado, ahora = Date.now()) => estado.palabraDia?.dia === diaLocal(ahora);
export function marcarVista(estado, ahora = Date.now()) {
  estado.palabraDia = { dia: diaLocal(ahora) };
}

/** Texto para compartir: la palabra en los idiomas que tengan traducción. */
export function textoCompartir(titulo, filas) {
  return [titulo, ...filas.filter((f) => f.texto).map((f) => `${f.code.toUpperCase()} · ${f.texto}`)].join('\n');
}
