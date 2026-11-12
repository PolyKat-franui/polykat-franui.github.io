// ---------- Estudio libre: elegir qué repasar sin mover el calendario ----------
import { t, tn, tMega, MEGA_TEMAS } from '../i18n.js';
import * as store from '../store.js';
import { dificultad } from '../srs.js';
import { filtrarLibre, ordenar } from '../sesion.js';
import * as banco from '../banco.js';
import { $, $$, esc, vista, htmlVacio, cargando } from '../ui.js';
import { S } from '../estado.js';
import { insignia } from '../marco.js';

const libreFiltro = { texto: '', mega: '', nivel: 'vistas', elegidos: new Set() };
const MAX_LIBRE_LISTA = 120, MAX_LIBRE_SESION = 40;
export async function vistaLibre() {
  if (!S.aprendiendo) return void (location.hash = '#/idiomas');
  const meta = S.aprendiendo, nativo = S.ajustes.nativo;
  cargando();
  await banco.prepararPar(meta, nativo);
  const prog = store.progresoDe(S, meta);
  const todos = ordenar(banco.disponibles(meta, nativo));
  const nivelDe = (id) => dificultad(prog[id]);
  const textos = (id) => [banco.texto(meta, id)?.texto ?? '', banco.texto(nativo, id)?.texto ?? ''];
  const f = libreFiltro;
  const chips = [['vistas', t('libre_f_vistas')], ['dominada', t('niv_dominada')], ['facil', t('niv_facil')], ['media', t('niv_media')], ['dificil', t('niv_dificil')], ['favoritos', t('libre_f_favoritos')], ['todas', t('libre_f_todas')]];
  vista.innerHTML = `
    <section class="pagina angosta libre">
      <h1 class="display">${t('libre_titulo')}</h1>
      <p class="suave">${t('libre_texto')}</p>
      <label class="campo"><span>${t('libre_buscar')}</span><input type="search" id="libre-q" value="${esc(f.texto)}" autocomplete="off" enterkeyhint="search"></label>
      <label class="campo"><span>${t('libre_tema')}</span><select id="libre-tema"><option value="">${t('libre_todos_temas')}</option>${MEGA_TEMAS.map((m) => `<option value="${esc(m)}" ${m === f.mega ? 'selected' : ''}>${esc(tMega(m))}</option>`).join('')}</select></label>
      <div class="libre-chips" role="radiogroup" aria-label="${t('libre_titulo')}">${chips.map(([v, l]) => `<button type="button" role="radio" data-nivel="${v}" aria-checked="${f.nivel === v}">${l}</button>`).join('')}</div>
      <div class="libre-barra"><span id="libre-cuenta"></span><button class="btn pequeno" type="button" id="libre-marcar"></button></div>
      <ul class="libre-lista" id="libre-lista"></ul>
      <p class="suave pequeno" id="libre-mas"></p>
      <div class="libre-acciones">
        <button class="btn" type="button" id="libre-azar">${t('libre_azar')}</button>
        <button class="btn primario grande" type="button" id="libre-ir"></button>
      </div>
    </section>`;
  let visibles = [];
  const pintar = () => {
    visibles = filtrarLibre(todos, { ...f, favoritos: new Set(S.favoritos[meta] ?? []) }, { nivelDe, textos });
    const mostrar = visibles.slice(0, MAX_LIBRE_LISTA);
    $('#libre-cuenta').textContent = tn('libre_n', visibles.length);
    $('#libre-lista').innerHTML = mostrar.length ? mostrar.map((c) => `
      <li><label class="libre-fila"><input type="checkbox" value="${c.id}" ${f.elegidos.has(c.id) ? 'checked' : ''}>
        <span class="libre-palabra"><strong lang="${meta}">${esc(banco.texto(meta, c.id).texto)}</strong><small lang="${nativo}">${esc(banco.texto(nativo, c.id).texto)}</small></span>
        ${insignia(nivelDe(c.id))}</label></li>`).join('') : `<li>${htmlVacio(t('libre_vacio'), 'confundida')}</li>`;
    $('#libre-mas').textContent = visibles.length > MAX_LIBRE_LISTA ? t('libre_mas', { n: MAX_LIBRE_LISTA, m: visibles.length }) : '';
    $$('#libre-lista input').forEach((i) => i.addEventListener('change', () => { i.checked ? f.elegidos.add(i.value) : f.elegidos.delete(i.value); botones(); }));
    botones();
  };
  const botones = () => {
    const n = Math.min(f.elegidos.size, MAX_LIBRE_SESION);
    $('#libre-ir').disabled = !n;
    $('#libre-ir').textContent = t('libre_estudiar', { n });
    $('#libre-marcar').textContent = f.elegidos.size ? t('libre_desmarcar') : t('libre_marcar');
  };
  const ir = (ids) => { location.hash = `#/estudiar?${new URLSearchParams({ ids: ids.slice(0, MAX_LIBRE_SESION).join(',') })}`; };
  $('#libre-q').addEventListener('input', (e) => { f.texto = e.target.value; pintar(); });
  $('#libre-tema').addEventListener('change', (e) => { f.mega = e.target.value; pintar(); });
  $$('.libre-chips [data-nivel]', vista).forEach((b) => b.addEventListener('click', () => {
    f.nivel = b.dataset.nivel; $$('.libre-chips [data-nivel]', vista).forEach((x) => x.setAttribute('aria-checked', String(x === b))); pintar();
  }));
  $('#libre-marcar').addEventListener('click', () => {
    if (f.elegidos.size) f.elegidos.clear(); else visibles.slice(0, MAX_LIBRE_SESION).forEach((c) => f.elegidos.add(c.id));
    pintar();
  });
  $('#libre-ir').addEventListener('click', () => ir([...f.elegidos]));
  $('#libre-azar').addEventListener('click', () => {
    const base = visibles.length ? visibles : todos;
    ir([...base].sort(() => Math.random() - 0.5).slice(0, 10).map((c) => c.id));
  });
  pintar();
}
