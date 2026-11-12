// Polykat — chat de Kitty: busca palabras del banco y propone frases con vocabulario conocido (lógica en kitty.js).
import { t, tTipo } from './i18n.js';
import * as store from './store.js';
import * as banco from './banco.js';
import { buscar, fraseConocida, normalizar } from './kitty.js';
import { $, $$, esc, cara } from './ui.js';
import { S, sesion } from './estado.js';

// ---------- Kitty (chat) ----------
let kittyEntradas = null;
let ultimaFrase = null;
/** Al cambiar el idioma de la app, las entradas se vuelven a armar. */
export function olvidarEntradasKitty() { kittyEntradas = null; }

/** Mensaje en el chat. Los de Kitty llevan su cara (expresión) al lado. */
function kittyMsg(html, de = 'kitty', expresion = 'feliz') {
  const el = document.createElement('p');
  el.className = `msg msg-${de}`;
  el.innerHTML = html;
  let fila = el;
  if (de === 'kitty') {
    fila = document.createElement('div');
    fila.className = 'msg-fila';
    fila.innerHTML = `<img class="msg-cara" src="${cara(expresion)}" alt="" width="40" height="32">`;
    fila.append(el);
    $('#kitty-cara').src = cara(expresion);
  }
  $('#kitty-msgs').append(fila);
  fila.scrollIntoView({ block: 'end' });
}

async function entradasKitty() {
  if (!S.aprendiendo) return [];
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  if (kittyEntradas?.par === meta + nativo) return kittyEntradas.lista;
  await banco.prepararPar(meta, nativo);
  const lista = banco.disponibles(meta, nativo).map((c) => ({
    id: c.id, tipos: c.tipos, meta: banco.texto(meta, c.id).texto, nativo: banco.texto(nativo, c.id).texto,
    borrador: banco.texto(meta, c.id).borrador || banco.texto(nativo, c.id).borrador,
  }));
  kittyEntradas = { par: meta + nativo, lista };
  return lista;
}

const fichaKitty = (e) => `<span lang="${S.aprendiendo}">«${esc(e.meta)}»</span> → <span lang="${S.ajustes.nativo}">«${esc(e.nativo)}»</span>
  <small>${t('kitty_tipo')}: ${e.tipos.map((x) => esc(tTipo(x))).join(', ')}${e.borrador ? ' · ' + t('borrador') : ''}</small>`;

async function kittyResponder(texto) {
  const entradas = await entradasKitty();
  if (!S.aprendiendo) return kittyMsg(esc(t('idiomas_titulo')), 'kitty', 'pensando');
  const q = normalizar(texto);
  if (q === normalizar(t('kitty_palabra_frase')) || q === 'frase' || q === 'phrase') {
    const f = fraseConocida(entradas, store.progresoDe(S, S.aprendiendo), ultimaFrase);
    if (!f) return kittyMsg(esc(t('kitty_sin_frase')), 'kitty', 'pensando');
    ultimaFrase = f.id;
    return kittyMsg(`${esc(t('kitty_frase'))}<br>${fichaKitty(f)}`, 'kitty', 'guino');
  }
  const r = buscar(texto, entradas);
  if (r.length) kittyMsg(r.map(fichaKitty).join('<br>'), 'kitty', 'feliz');
  else kittyMsg(esc(t('kitty_no', { q: texto })), 'kitty', 'confundida');
}

export function kittyAbrir() {
  const panel = $('#kitty-panel');
  if (!$('#kitty-msgs').childElementCount) kittyMsg(esc(t('kitty_hola')), 'kitty', 'muy_feliz');
  const rapidas = [`<button type="button" class="chip" data-r="frase">${esc(t('kitty_palabra_frase'))}</button>`];
  const slide = sesion ? $$('#feed .slide')[sesion.actual] : null;
  if (slide && !slide.classList.contains('fin')) rapidas.unshift(`<button type="button" class="chip" data-r="esta">${esc(t('kitty_esta'))}</button>`);
  $('#kitty-rapidas').innerHTML = rapidas.join('');
  $$('#kitty-rapidas button').forEach((b) => b.addEventListener('click', async () => {
    if (b.dataset.r === 'frase') { kittyMsg(esc(t('kitty_palabra_frase')), 'yo'); kittyResponder(t('kitty_palabra_frase')); return; }
    const id = slide.dataset.id;
    const e = (await entradasKitty()).find((x) => x.id === id);
    kittyMsg(esc(t('kitty_esta')), 'yo');
    const ipa = banco.texto(S.aprendiendo, id).ipa;
    if (e) kittyMsg(`${fichaKitty(e)}${ipa ? `<br><small>IPA: /${esc(ipa)}/</small>` : ''}`, 'kitty', 'orgullosa');
  }));
  panel.showModal();
  $('#kitty-input').focus();
}
$('#kitty-fab').addEventListener('click', kittyAbrir);
$('#kitty-cerrar').addEventListener('click', () => $('#kitty-panel').close());
$('#kitty-panel').addEventListener('click', (e) => { if (e.target.id === 'kitty-panel') e.target.close(); });
$('#kitty-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#kitty-input');
  const texto = input.value.trim();
  if (!texto) return;
  kittyMsg(esc(texto), 'yo');
  input.value = '';
  kittyResponder(texto);
});
