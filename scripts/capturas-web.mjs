// Capturas REALES de la app para el teléfono de la portada de la web (pasan como historias de Instagram).
//   web/capturas/app-menu.jpg · app-tarjeta.jpg · app-temas.jpg · app-jardin.jpg
// Arma un avance de ejemplo (racha de 7 días, tokens, jardín con adornos) y fotografía la app de verdad.
// Volver a correrlo cuando cambie el aspecto de la app:
//   NODE_PATH=$(npm root -g) node scripts/capturas-web.mjs
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { servir } from './servir.mjs';
import { jardinInicial, umbral } from '../app/js/jardin.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'web', 'capturas');
const PUERTO = 5198;
mkdirSync(SALIDA, { recursive: true });

const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const hoy = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const novedad = JSON.parse(readFileSync(join(RAIZ, 'app', 'data', 'novedades.json'), 'utf8')).novedades[0]?.version ?? null;
const estado = {
  perfil: { nombre: 'Fran', cuenta: null, elegido: true },
  ajustes: { nativo: 'es' },
  aprendiendo: 'en',
  tutorialVisto: true,
  novedadVista: novedad,
  ejercicios: 180,
  tokens: 240,
  diamantes: 2,
  racha: { actual: 7, mejor: 12, ultimoDia: hoy },
  diario: { dia: hoy, revisadas: 14, premios: 1 },
  jardin: { ...jardinInicial(), crecimiento: umbral(4) + 8, tiene: { mantel: true, 'set-te': true, cesta: true, farol: true, wagasa: true, dango: true } },
};

const server = await servir(PUERTO);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, locale: 'es-CL', colorScheme: 'light' });
await ctx.addInitScript((e) => {
  window.__sinSorpresas = true; // sin diamantes sorpresa en la foto
  localStorage.setItem('franui:aviso-descarga', String(Date.now()));
  if (!localStorage.getItem('franui:v1')) localStorage.setItem('franui:v1', JSON.stringify(e));
}, estado);
const page = await ctx.newPage();
const URL_APP = `http://localhost:${PUERTO}/app/`;
const foto = (nombre) => page.screenshot({ path: join(SALIDA, `app-${nombre}.jpg`), type: 'jpeg', quality: 82 });

await page.goto(`${URL_APP}#/menu`); await page.waitForTimeout(3600); await foto('menu');
await page.goto(`${URL_APP}#/estudiar?dif=todas`); await page.waitForTimeout(1500);
await page.locator('#feed .slide').first().locator('.revelar').click(); await page.waitForTimeout(1200); await foto('tarjeta');
await page.goto(`${URL_APP}#/aprender`); await page.waitForTimeout(1800); await foto('temas');
await page.goto(`${URL_APP}#/jardin`); await page.waitForTimeout(2200); await foto('jardin');

await browser.close();
server.close();
console.log('✓ 4 capturas reales en web/capturas/');
