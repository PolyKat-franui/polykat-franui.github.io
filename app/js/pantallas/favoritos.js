// ---------- Favoritos (separados por idioma) ----------
import { t, nombreIdioma } from '../i18n.js';
import * as store from '../store.js';
import { dificultad } from '../srs.js';
import * as banco from '../banco.js';
import { hablar } from '../voz.js';
import { ICON } from '../iconos.js';
import { $, $$, esc, vista, cara, toast, cargando } from '../ui.js';
import { S, guardar } from '../estado.js';
import { insignia } from '../marco.js';

export async function vistaFavoritos(r) {
  const nativo = S.ajustes.nativo;
  const conFavs = Object.keys(S.favoritos).filter((l) => l !== nativo && (S.favoritos[l] ?? []).length);
  const pedido = r?.q?.get('l');
  const meta = conFavs.includes(pedido) ? pedido : conFavs.includes(S.aprendiendo) ? S.aprendiendo : conFavs[0];
  if (!meta) {
    vista.innerHTML = `
      <section class="pagina angosta">
        <h1 class="display">${t('fav_titulo')}</h1>
        <div class="vacio-estado centro"><img class="cara-grande" src="${cara('enamorada')}" alt="" width="80" height="64"><p class="suave">${t('fav_vacio')}</p></div>
      </section>`;
    return;
  }
  cargando();
  await banco.prepararPar(meta, nativo);
  const ids = (S.favoritos[meta] ?? []).filter((id) => banco.texto(meta, id) && banco.texto(nativo, id));
  const prog = store.progresoDe(S, meta);
  const pestanas = conFavs.map((l) => `<a class="pestana-idioma" href="#/favoritos?l=${l}" ${l === meta ? 'aria-current="page"' : ''}>
      <span class="monograma pequeno" aria-hidden="true">${l.toUpperCase()}</span><span lang="${l}">${esc(nombreIdioma(l))}</span><small>${S.favoritos[l].length}</small></a>`).join('');
  const filas = ids.map((id) => `<li class="fila-fav" data-id="${id}">
        <button class="icon-btn btn-audio" type="button" aria-label="${t('escuchar')}">${ICON.audio}</button>
        <div><strong lang="${meta}">${esc(banco.texto(meta, id).texto)}</strong><span lang="${nativo}">${esc(banco.texto(nativo, id).texto)}</span></div>
        ${insignia(dificultad(prog[id]))}
        <button class="icon-btn btn-quitar" type="button" aria-label="${t('quitar_favorito')}">${ICON.corazonLleno}</button>
      </li>`).join('');
  vista.innerHTML = `
    <section class="pagina angosta">
      <h1 class="display">${t('fav_titulo')}</h1>
      <nav class="pestanas-idioma" aria-label="${t('fav_titulo')}">${pestanas}</nav>
      <button class="btn primario" type="button" id="btn-fav-estudiar">${t('fav_estudiar')}</button>
      <ul class="lista-fav">${filas}</ul>
    </section>`;
  $('#btn-fav-estudiar').addEventListener('click', () => { S.aprendiendo = meta; guardar(); location.hash = '#/estudiar?fav=1'; });
  $$('.fila-fav').forEach((li) => {
    $('.btn-audio', li).addEventListener('click', () => { if (!hablar(banco.texto(meta, li.dataset.id).texto, meta)) toast(t('sin_voz')); });
    $('.btn-quitar', li).addEventListener('click', () => {
      store.alternarFavorito(S, meta, li.dataset.id); guardar();
      vistaFavoritos({ q: new URLSearchParams({ l: meta }) });
    });
  });
}
