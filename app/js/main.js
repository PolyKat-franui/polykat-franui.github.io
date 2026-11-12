// Polykat — arranque y rutas con # (funciona en cualquier hosting estático, p. ej. GitHub Pages).
// Cada pantalla vive en js/pantallas/; lo que comparten, en ui.js, estado.js y marco.js.
import { traspasado } from './traspaso.js'; // primero: puede traer el avance desde la dirección antigua
import { t, cargarIdiomaUI } from './i18n.js';
import * as store from './store.js';
import { sonido } from './sonido.js';
import { musica } from './musica.js';
import { sembrarAdornos, sembrarVisitantes, estallido } from './adornos.js';
import { $, vista, toast, registrarRouter } from './ui.js';
import { S, sincronizarAlAbrir, aplicarAjustes, nativoInicial } from './estado.js';
import { pintarMarco, setUltimaVersion, marcarAvisoNovedades } from './marco.js';
import { avisoDescarga } from './instalacion.js';
import { vistaInicio, vistaConservar } from './pantallas/inicio.js';
import { vistaIdiomas } from './pantallas/idiomas.js';
import { vistaAprender, vistaTema } from './pantallas/aprender.js';
import { vistaPalabra } from './pantallas/palabra.js';
import { vistaJardin } from './pantallas/pantalla-jardin.js';
import { vistaMenu } from './pantallas/menu.js';
import { vistaInstalar } from './pantallas/instalar.js';
import { cerrarSesion, vistaEstudiar } from './pantallas/estudiar.js';
import { vistaFavoritos } from './pantallas/favoritos.js';
import { vistaRanking } from './pantallas/ranking.js';
import { vistaLibre } from './pantallas/libre.js';
import { enviarSugerenciasPendientes, vistaBuzon } from './pantallas/buzon.js';
import { vistaNovedades } from './pantallas/novedades.js';
import { vistaAjustes } from './pantallas/ajustes.js';
import { registrarVisita } from './medicion.js';

let primeraCarga = true;

// ---------- Router ----------
function leerRuta() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const partes = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { nombre: partes[0] || '', args: partes.slice(1), q: new URLSearchParams(qs || '') };
}

const RUTAS = {
  inicio: vistaInicio,
  menu: vistaMenu,
  instalar: vistaInstalar,
  jardin: vistaJardin,
  buzon: vistaBuzon,
  libre: vistaLibre,
  conservar: vistaConservar,
  idiomas: vistaIdiomas,
  aprender: vistaAprender,
  tema: vistaTema,
  estudiar: vistaEstudiar,
  favoritos: vistaFavoritos,
  ranking: vistaRanking,
  novedades: vistaNovedades,
  palabra: vistaPalabra,
  ajustes: vistaAjustes,
};

async function router() {
  const r = leerRuta();
  if (!S.perfil.elegido && !['inicio', 'conservar', 'instalar'].includes(r.nombre)) return void location.replace('#/inicio');
  if (!RUTAS[r.nombre]) return void location.replace('#/menu');
  cerrarSesion();
  document.body.dataset.ruta = r.nombre;
  pintarMarco(r.nombre);
  await RUTAS[r.nombre](r);
  avisoDescarga(r.nombre);
  if (!primeraCarga) vista.focus({ preventScroll: true });
  primeraCarga = false;
  if (r.nombre !== 'estudiar') scrollTo(0, 0);
}
addEventListener('hashchange', router);
registrarRouter(router); // para que los demás módulos puedan volver a dibujar la vista
sembrarAdornos($('#adornos'), { cantidad: 10 });
sembrarVisitantes($('#adornos'), { nubes: 2, abejas: 1 });
// Estallido de sakuras y monedas al elegir un tema o un idioma
document.addEventListener('click', (e) => {
  if (e.target.closest('.neurona:not(.vacio), .nodo-idioma:not([aria-disabled="true"])')) estallido(e.clientX, e.clientY);
});

fetch('data/novedades.json').then((r) => r.json()).then((d) => { setUltimaVersion(d.novedades[0]?.version ?? null); marcarAvisoNovedades(); }).catch(() => {});
// Clic suave en botones y enlaces (los sonidos especiales se suman encima)
// La música (si está encendida) parte con el primer toque: los navegadores no dejan sonar antes.
document.addEventListener('pointerdown', () => { if (S.ajustes.musica) musica(true); }, { once: true, passive: true });
document.addEventListener('pointerdown', (e) => { if (e.target.closest('button, a, [role="radio"], input[type="checkbox"], select')) sonido.toque(); }, { passive: true });

// ---------- Arranque ----------
S.ajustes.nativo ??= nativoInicial();
await cargarIdiomaUI(S.ajustes.nativo); // solo se descargan los textos del idioma de la persona
aplicarAjustes();
if (store.usarProtectores(S)) { store.guardar(S); setTimeout(() => toast(t('protector_usado')), 1500); }
if (traspasado) setTimeout(() => toast(t('traspaso_ok')), 1200);
setTimeout(() => enviarSugerenciasPendientes(), 3000);
{ const c = store.actualizarLiga(S); if (c === 'sube' || c === 'baja') { store.guardar(S); setTimeout(() => toast(t(c === 'sube' ? 'liga_sube' : 'liga_baja', { liga: t('liga_' + store.LIGAS[S.liga.nivel]) })), 2200); } }
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', aplicarAjustes);
router();
sincronizarAlAbrir();
setTimeout(() => registrarVisita(), 2500); // medición anónima: una vez al día como máximo
