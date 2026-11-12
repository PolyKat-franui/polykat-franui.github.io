// ---------- Idiomas ----------
import { t, nombreIdioma } from '../i18n.js';
import { sonido } from '../sonido.js';
import { $$, esc, vista, toast, ir } from '../ui.js';
import { S, guardar } from '../estado.js';
import { htmlArana } from '../marco.js';

let idiomas = [];
async function cargarIdiomas() {
  if (!idiomas.length) idiomas = (await (await fetch('data/idiomas.json')).json()).idiomas;
  return idiomas;
}

export async function vistaIdiomas() {
  await cargarIdiomas();
  const nativo = S.ajustes.nativo;
  const nodos = idiomas.filter((i) => i.code !== nativo).map((i) => {
    const pronto = i.estado === 'proximamente';
    const etiqueta = i.code === S.aprendiendo ? `<span class="tag tag-activo">${t('aprendiendo')}</span>`
      : i.estado === 'nuevo' ? `<span class="tag tag-nuevo">${t('estado_nuevo')}</span>`
        : pronto ? `<span class="tag tag-pronto">${t('estado_pronto')}</span>` : '';
    return `<button type="button" class="nodo-idioma idioma ${pronto ? 'pronto' : ''} ${i.estado === 'nuevo' ? 'nuevo' : ''} ${i.code === S.aprendiendo ? 'activo' : ''}" data-code="${i.code}" ${pronto ? 'aria-disabled="true"' : ''}>
        <span class="monograma" aria-hidden="true">${i.code.toUpperCase()}</span>
        <span class="nodo-nombre">${esc(nombreIdioma(i.code))}</span>${etiqueta}
      </button>`;
  });
  const centro = `<span class="monograma grande" aria-hidden="true">${nativo.toUpperCase()}</span><strong>${esc(nombreIdioma(nativo))}</strong><small>${t('idioma_nativo')}</small>`;
  vista.innerHTML = `
    <section class="pagina pagina-arana">
      <p class="sobretitulo">${t('nav_aprender')}</p>
      <h1 class="display">${t('idiomas_titulo')}</h1>
      <p class="suave">${t('idiomas_sub')}</p>
      ${htmlArana(centro, nodos)}
    </section>`;
  $$('.nodo-idioma').forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-disabled') === 'true') return toast(t('estado_pronto'));
    sonido.moneda();
    S.aprendiendo = b.dataset.code;
    guardar();
    ir('#/aprender');
  }));
}
