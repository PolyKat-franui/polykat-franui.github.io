// ---------- Palabra del día ----------
// La misma palabra para toda la comunidad cada día, en los 6 idiomas (lógica en palabra-dia.js).
import { t, idiomaUI, tMega, tTipo, nombreIdioma } from '../i18n.js';
import * as store from '../store.js';
import * as banco from '../banco.js';
import { hablar } from '../voz.js';
import { ICON } from '../iconos.js';
import { sonido } from '../sonido.js';
import * as PD from '../palabra-dia.js';
import { $, $$, esc, vista, cara, toast, htmlVacio, cargando, marcar, estallarCorazones } from '../ui.js';
import { S, guardar } from '../estado.js';
import { EMOJI_MEGA } from '../marco.js';

/** Idioma en que se destaca: el que aprende; si aún no elige, inglés (o español si su idioma es inglés). */
export const idiomaPrincipal = () => S.aprendiendo || (S.ajustes.nativo === 'en' ? 'es' : 'en');

async function idPalabraDia() {
  const [conceptos, ejEn] = await Promise.all([banco.cargarConceptos(), banco.cargarEjemplos('en')]);
  return PD.palabraDelDia(store.diaLocal(Date.now()), PD.candidatos(conceptos, ejEn));
}

/** Escribe la palabra de hoy en la tarjeta del menú (se carga después de pintar el menú). */
export async function pintarPalabraMenu() {
  try {
    const meta = idiomaPrincipal();
    const id = await idPalabraDia();
    await banco.cargarIdioma(meta);
    const el = $('#menu-palabra-texto');
    if (el && id) el.textContent = banco.texto(meta, id)?.texto ?? '';
  } catch { /* sin conexión: queda el «…» */ }
}

export async function vistaPalabra() {
  cargando();
  const meta = idiomaPrincipal(), nativo = S.ajustes.nativo;
  const id = await idPalabraDia();
  await Promise.all([...PD.IDIOMAS_PALABRA.map((l) => banco.cargarIdioma(l)), banco.cargarEjemplos(meta), banco.cargarEjemplos(nativo)]);
  const c = id && banco.concepto(id), a = id && banco.texto(meta, id);
  if (!c || !a) {
    vista.innerHTML = `<section class="pagina angosta centro">${htmlVacio(t('pd_sin'))}</section>`;
    return;
  }
  PD.marcarVista(S); guardar();
  const b = nativo !== meta ? banco.texto(nativo, id) : null;
  const filas = PD.IDIOMAS_PALABRA.map((code) => ({ code, ...(banco.texto(code, id) ?? {}) }));
  const ejA = banco.ejemplo(meta, id), ejB = nativo !== meta ? banco.ejemplo(nativo, id) : null;
  const nota = meta === 'en' ? banco.ejemplo(nativo, id)?.nota : '';
  const borrador = filas.some((f) => f.borrador) || ejA?.borrador || ejB?.borrador;
  let fecha = '';
  try { fecha = new Intl.DateTimeFormat(idiomaUI(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()); } catch { /* sin Intl */ }
  const botonAudio = (texto, code, etiqueta) => `<button class="icon-btn pd-audio" type="button" data-code="${code}" data-texto="${esc(texto)}" aria-label="${esc(etiqueta)}">${ICON.audio}</button>`;
  const htmlFav = (fav) => `${fav ? ICON.corazonLleno : ICON.corazon}<span>${t(fav ? 'hist_guardada' : 'hist_guardar')}</span>`;
  vista.innerHTML = `
    <section class="pagina angosta palabra-dia">
      <p class="sobretitulo">${t('pd_titulo')}${fecha ? ` · ${esc(fecha)}` : ''}</p>
      <article class="pd-tarjeta">
        <div class="tarjeta-top">
          <span class="chip-tema"><span aria-hidden="true">${EMOJI_MEGA[c.megas[0]] ?? '🌸'}</span>${esc(tMega(c.megas[0]))}</span>
          <span class="tipo">${c.tipos.map((x) => esc(tTipo(x))).join(' · ')}</span>
        </div>
        <h1 class="pd-palabra" lang="${meta}">${esc(a.texto)}</h1>
        ${a.ipa && S.ajustes.ipa ? `<p class="ipa" lang="${meta}" title="IPA">/${esc(a.ipa)}/</p>` : ''}
        ${b ? `<p class="pd-trad" lang="${nativo}">${esc(b.texto)}</p>` : ''}
        ${botonAudio(a.texto, meta, t('escuchar'))}
        ${ejA ? `<div class="pd-ejemplo">
          <p lang="${meta}">${marcar(ejA.ejemplo)}</p>
          ${ejB ? `<p class="suave" lang="${nativo}">${marcar(ejB.ejemplo)}</p>` : ''}
          ${botonAudio(ejA.ejemplo.replace(/\*/g, ''), meta, t('ej_escuchar'))}
        </div>` : ''}
        ${borrador ? `<span class="borrador">${t('borrador')}</span>` : ''}
      </article>
      <div class="pd-kitty">
        <img src="${cara('guino')}" alt="" width="80" height="64">
        <p class="burbuja-texto">${t('pd_kitty')}</p>
      </div>
      ${nota ? `<p class="pd-nota">💡 ${marcar(nota)}</p>` : ''}
      <h2 class="pd-subtitulo">${t('pd_idiomas')}</h2>
      <ul class="pd-idiomas">
        ${filas.map((f) => `<li class="${f.code === meta ? 'destacada' : ''}">
          <span class="monograma pequeno" aria-hidden="true">${f.code.toUpperCase()}</span>
          <span class="pd-idioma">${esc(nombreIdioma(f.code))}</span>
          <strong lang="${f.code}">${f.texto ? esc(f.texto) : '—'}</strong>
          ${f.texto ? botonAudio(f.texto, f.code, `${t('escuchar')}: ${nombreIdioma(f.code)}`) : ''}
        </li>`).join('')}
      </ul>
      <div class="acciones">
        <button class="btn primario" type="button" id="pd-fav" aria-pressed="${store.esFavorito(S, meta, id)}">${htmlFav(store.esFavorito(S, meta, id))}</button>
        ${S.aprendiendo ? `<a class="btn" id="pd-practicar" href="#/estudiar?ids=${encodeURIComponent(id)}">${ICON.jugar}<span>${t('pd_practicar')}</span></a>` : ''}
        <button class="btn" type="button" id="pd-compartir">${ICON.enviar}<span>${t('pd_compartir')}</span></button>
      </div>
      <p class="suave centro">${t('pd_manana')}</p>
    </section>`;
  $$('.pd-audio', vista).forEach((btn) => btn.addEventListener('click', () => {
    if (!hablar(btn.dataset.texto, btn.dataset.code)) toast(t('sin_voz'));
  }));
  $('#pd-fav').addEventListener('click', (e) => {
    const boton = e.currentTarget;
    const ahora = store.alternarFavorito(S, meta, id); guardar();
    boton.setAttribute('aria-pressed', String(ahora));
    boton.innerHTML = htmlFav(ahora);
    if (ahora) { sonido.like(); estallarCorazones(boton); }
  });
  $('#pd-compartir').addEventListener('click', async () => {
    const texto = `${PD.textoCompartir(`${t('pd_titulo')} · Polykat`, filas)}\nhttps://polykat-franui.github.io`;
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else { await navigator.clipboard.writeText(texto); toast(t('pd_copiada')); }
    } catch { /* la persona canceló o no hay portapapeles */ }
  });
}
