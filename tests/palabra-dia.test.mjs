import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as PD from '../app/js/palabra-dia.js';

const leer = (f) => JSON.parse(readFileSync(new URL(`../app/data/banco/${f}`, import.meta.url)));
const conceptos = leer('conceptos.json').map(([id, tipos, megas, temas, rango, nivel]) => ({ id, tipos, megas, temas, rango, nivel }));
const ejEn = leer('ej-en.json');
const lista = PD.candidatos(conceptos, ejEn);
const porId = new Map(conceptos.map((c) => [c.id, c]));

test('candidatos: palabras con ejemplo, sin frases ni nombres propios', () => {
  assert.ok(lista.length > 300, `hay suficientes palabras (${lista.length})`);
  for (const id of lista) {
    const c = porId.get(id);
    assert.ok(ejEn[id], `${id} tiene ejemplo`);
    assert.ok(!c.tipos.includes('frase') && !c.tipos.includes('nombre propio'), `${id} es una palabra`);
  }
});

test('la misma palabra todo el día y para todas las personas', () => {
  assert.equal(PD.palabraDelDia('2026-11-11', lista), PD.palabraDelDia('2026-11-11', [...lista]));
  assert.notEqual(PD.palabraDelDia('2026-11-11', lista), PD.palabraDelDia('2026-11-12', lista));
});

test('no se repite ninguna palabra hasta pasar por todas', () => {
  const vistas = new Set();
  const inicio = PD.numeroDia('2026-11-11');
  for (let k = 0; k < lista.length; k++) {
    const d = new Date((inicio + k) * 86400000).toISOString().slice(0, 10);
    vistas.add(PD.palabraDelDia(d, lista));
  }
  assert.equal(vistas.size, lista.length);
});

test('numeroDia cruza bien meses y años', () => {
  assert.equal(PD.numeroDia('2027-01-01') - PD.numeroDia('2026-12-31'), 1);
  assert.equal(PD.numeroDia('2026-03-01') - PD.numeroDia('2026-02-28'), 1);
  assert.equal(PD.palabraDelDia('2026-11-11', []), null);
});

test('vista de hoy y texto para compartir', () => {
  const e = {};
  const hoy = new Date(2026, 10, 11, 9).getTime();
  assert.equal(PD.vistaHoy(e, hoy), false);
  PD.marcarVista(e, hoy);
  assert.equal(PD.vistaHoy(e, hoy), true);
  assert.equal(PD.vistaHoy(e, new Date(2026, 10, 12, 9).getTime()), false, 'al otro día vuelve a ser nueva');
  assert.equal(PD.textoCompartir('Palabra del día', [{ code: 'en', texto: 'tree' }, { code: 'es', texto: 'árbol' }, { code: 'de' }]),
    'Palabra del día\nEN · tree\nES · árbol');
});
