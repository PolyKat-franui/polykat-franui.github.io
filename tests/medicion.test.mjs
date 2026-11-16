// Medición anónima: código al azar en el celular, una visita al día y resumen de retorno.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../app/js/medicion.js';

const almacen = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
};

test('el código anónimo es al azar, con forma de UUID y no se repite', () => {
  const a = M.codigoAzar(), b = M.codigoAzar();
  assert.match(a, /^[0-9a-f-]{36}$/);
  assert.notEqual(a, b);
});

test('el registro se crea una vez y se conserva en el celular', () => {
  const s = almacen();
  const r1 = M.leerRegistro(s, Date.UTC(2026, 10, 12, 15));
  const r2 = M.leerRegistro(s, Date.UTC(2026, 11, 1, 15));
  assert.equal(r1.id, r2.id);
  assert.equal(r2.desde, r1.desde, 'el día de inicio no cambia');
  assert.equal(r1.activa, true, 'viene encendida por defecto');
  assert.ok(!JSON.stringify(r1).includes('@'), 'no guarda correos');
});

test('la visita se avisa como máximo una vez al día y nunca si está apagada', () => {
  assert.equal(M.debeRegistrarVisita({ activa: true, ultimo: null }, '2026-11-12'), true);
  assert.equal(M.debeRegistrarVisita({ activa: true, ultimo: '2026-11-12' }, '2026-11-12'), false);
  assert.equal(M.debeRegistrarVisita({ activa: true, ultimo: '2026-11-12' }, '2026-11-13'), true);
  assert.equal(M.debeRegistrarVisita({ activa: false, ultimo: null }, '2026-11-12'), false);
});

test('resumen de retorno: día 1, 7 y 30, solo con quienes ya cumplieron ese plazo', () => {
  const docs = [
    { primer: '2026-10-01', dias: ['2026-10-01', '2026-10-02', '2026-10-09', '2026-11-05'], sesiones: 5 }, // vuelve en todo
    { primer: '2026-10-01', dias: ['2026-10-01'], sesiones: 1 },                                            // no vuelve
    { primer: '2026-11-08', dias: ['2026-11-08', '2026-11-09'], sesiones: 2 },                              // muy nueva para el día 7
    { basura: true },
  ];
  const r = M.resumenRetorno(docs, '2026-11-12');
  assert.equal(r.personas, 3);
  assert.equal(r.sesiones, 8);
  assert.deepEqual(r.d1, { volvieron: 2, de: 3, pct: 67 });
  assert.deepEqual(r.d7, { volvieron: 1, de: 2, pct: 50 });
  assert.deepEqual(r.d30, { volvieron: 1, de: 2, pct: 50 });
  assert.equal(r.activasSemana, 1, 'semana = hoy y los 6 días anteriores; el 5 de noviembre queda fuera');
  assert.equal(M.resumenRetorno([], '2026-11-12').d7, null, 'sin datos no inventa porcentajes');
});

test('el día se calcula en la hora local', () => {
  assert.match(M.diaDe(Date.UTC(2026, 10, 12, 12)), /^\d{4}-\d{2}-\d{2}$/);
});
