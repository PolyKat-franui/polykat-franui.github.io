// Prueba las reglas REALES de firestore.rules en el emulador de Firebase (sin tocar el proyecto real).
// Uso (una vez): npm i -g firebase-tools @firebase/rules-unit-testing firebase
//        luego:  NODE_PATH=$(npm root -g) npm run test:reglas
// Cada caso dice qué debe pasar: «sí» = permitido, «no» = rechazado.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, arrayUnion, increment } = require('firebase/firestore');

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
const env = await initializeTestEnvironment({
  projectId: 'demo-polykat',
  firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
});

const CREADORA = { email: 'fransanhueza206@gmail.com', email_verified: true };
const anon = env.unauthenticatedContext().firestore();
const ana = env.authenticatedContext('ana', { email: 'ana@example.com', email_verified: true }).firestore();
const beto = env.authenticatedContext('beto', { email: 'beto@example.com', email_verified: true }).firestore();
const fran = env.authenticatedContext('fran', CREADORA).firestore();
const franSinVerificar = env.authenticatedContext('falsa', { ...CREADORA, email_verified: false }).firestore();

let fallas = 0, total = 0;
async function caso(nombre, debe, promesa) {
  total++;
  try { await (debe ? assertSucceeds(promesa) : assertFails(promesa)); console.log(`  ✓ ${nombre}`); }
  catch (e) { fallas++; console.log(`  ✗ ${nombre} (${debe ? 'debía permitirse' : 'debía rechazarse'})`); }
}
const sembrar = (ruta, datos) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), ruta), datos));

console.log('Avance (progreso/{uid})');
await sembrar('progreso/ana', { datos: '{}' });
await caso('Ana lee su avance', true, getDoc(doc(ana, 'progreso/ana')));
await caso('Beto NO lee el avance de Ana', false, getDoc(doc(beto, 'progreso/ana')));
await caso('Sin cuenta NO lee avances', false, getDoc(doc(anon, 'progreso/ana')));
await caso('Beto NO escribe el avance de Ana', false, setDoc(doc(beto, 'progreso/ana'), { datos: '{}' }));

console.log('Ranking (ranking/{uid})');
const fila = { nombre: 'Ana', racha: 3, dia: '2026-11-16', palabras: 10, nivel: 1, actualizado: 1 };
await caso('Ana publica su fila', true, setDoc(doc(ana, 'ranking/ana'), fila));
await caso('Ana NO publica su correo', false, setDoc(doc(ana, 'ranking/ana'), { ...fila, email: 'ana@example.com' }));
await caso('Beto NO escribe la fila de Ana', false, setDoc(doc(beto, 'ranking/ana'), fila));
await caso('Nombre de más de 30 letras: NO', false, setDoc(doc(ana, 'ranking/ana'), { ...fila, nombre: 'x'.repeat(31) }));
await caso('Sin cuenta NO ve el ranking', false, getDocs(collection(anon, 'ranking')));

console.log('Medición anónima (uso/{código})');
const ID = '3f2b8c1e-9a4d-4c2e-8f1a-0b6d5e7c9a21';
const nuevo = { primer: '2026-11-16', dias: ['2026-11-16'], sesiones: 0 };
await caso('Sin cuenta crea su código con un día', true, setDoc(doc(anon, 'uso/' + ID), nuevo));
await caso('Mismo día, +1 sesión (increment)', true, setDoc(doc(anon, 'uso/' + ID), { primer: nuevo.primer, dias: arrayUnion('2026-11-16'), sesiones: increment(1) }, { merge: true }));
await caso('Día nuevo (arrayUnion)', true, setDoc(doc(anon, 'uso/' + ID), { primer: nuevo.primer, dias: arrayUnion('2026-11-17'), sesiones: increment(0) }, { merge: true }));
await caso('Sumar 5 sesiones de golpe: NO', false, updateDoc(doc(anon, 'uso/' + ID), { sesiones: increment(5) }));
await caso('Agregar 2 días de golpe: NO', false, updateDoc(doc(anon, 'uso/' + ID), { dias: arrayUnion('2026-11-18', '2026-11-19') }));
await caso('Borrar días: NO', false, updateDoc(doc(anon, 'uso/' + ID), { dias: ['2026-11-16'] }));
await caso('Meter un día falso al medio: NO', false, updateDoc(doc(anon, 'uso/' + ID), { dias: ['2026-11-16', 'x'.repeat(5000), '2026-11-17'] }));
await caso('Cambiar el día de inicio: NO', false, updateDoc(doc(anon, 'uso/' + ID), { primer: '2020-01-01' }));
await caso('Último día con texto basura: NO', false, updateDoc(doc(anon, 'uso/' + ID), { dias: arrayUnion('<script>') }));
await caso('Agregar el correo: NO', false, updateDoc(doc(anon, 'uso/' + ID), { email: 'ana@example.com' }));
await caso('Código que no es UUID: NO', false, setDoc(doc(anon, 'uso/fran'), nuevo));
await caso('Crear con 2 días: NO', false, setDoc(doc(anon, 'uso/' + ID.replace('3f', '4f')), { ...nuevo, dias: ['2026-11-15', '2026-11-16'] }));
await caso('Crear con 50 sesiones: NO', false, setDoc(doc(anon, 'uso/' + ID.replace('3f', '5f')), { ...nuevo, sesiones: 50 }));
await caso('Sin cuenta NO lee la medición', false, getDocs(collection(anon, 'uso')));
await caso('Otra cuenta NO lee la medición', false, getDocs(collection(ana, 'uso')));
await caso('Correo de la creadora sin verificar: NO lee', false, getDocs(collection(franSinVerificar, 'uso')));
await caso('La creadora lee la medición', true, getDocs(collection(fran, 'uso')));
await caso('Nadie borra mediciones (ni sin cuenta)', false, deleteDoc(doc(anon, 'uso/' + ID)));

console.log('Buzón (sugerencias/{id})');
const sug = { texto: 'Hola', fecha: 1, idioma: 'es', version: '0.15.0', leida: false };
await caso('Sin cuenta envía una sugerencia', true, setDoc(doc(anon, 'sugerencias/s1'), sug));
await caso('Sugerencia ya «leída»: NO', false, setDoc(doc(anon, 'sugerencias/s2'), { ...sug, leida: true }));
await caso('Texto de más de 2000 letras: NO', false, setDoc(doc(anon, 'sugerencias/s3'), { ...sug, texto: 'x'.repeat(2001) }));
await caso('Firmar con el uid de otra persona: NO', false, setDoc(doc(beto, 'sugerencias/s4'), { ...sug, uid: 'ana' }));
await caso('Sin cuenta NO lee el buzón', false, getDocs(collection(anon, 'sugerencias')));
await caso('Otra cuenta NO lee el buzón', false, getDocs(collection(ana, 'sugerencias')));
await caso('La creadora lee el buzón', true, getDocs(collection(fran, 'sugerencias')));
await caso('La creadora marca como leída', true, updateDoc(doc(fran, 'sugerencias/s1'), { leida: true }));
await caso('La creadora NO cambia el texto', false, updateDoc(doc(fran, 'sugerencias/s1'), { texto: 'otro' }));
await caso('Sin cuenta NO borra sugerencias', false, deleteDoc(doc(anon, 'sugerencias/s1')));

console.log('Cualquier otra colección');
await caso('Colección inventada: NO escribe', false, setDoc(doc(anon, 'admin/x'), { a: 1 }));
await caso('Colección inventada: NO lee', false, getDocs(collection(ana, 'admin')));

await env.cleanup();
console.log(`\n${fallas ? '✗' : '✓'} Reglas: ${total - fallas}/${total} casos como se esperaba`);
process.exit(fallas ? 1 : 0);
