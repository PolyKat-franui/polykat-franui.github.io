// ---------- Novedades ----------
import { t } from '../i18n.js';
import { ICON } from '../iconos.js';
import { sonido } from '../sonido.js';
import { esc, vista } from '../ui.js';
import { S, guardar } from '../estado.js';
import { setUltimaVersion, marcarAvisoNovedades } from '../marco.js';

export async function vistaNovedades() {
  const data = await (await fetch('data/novedades.json')).json();
  const [ultima, ...resto] = data.novedades;
  const fecha = (f) => new Date(f + 'T12:00').toLocaleDateString(S.ajustes.nativo, { day: 'numeric', month: 'long', year: 'numeric' });
  setUltimaVersion(ultima.version);
  if (S.novedadVista !== ultima.version) { S.novedadVista = ultima.version; guardar(); }
  marcarAvisoNovedades();
  const confeti = [['sakura', 23, 23], ['estrella', 21, 21], ['moneda', 24, 24], ['corazon', 26, 24], ['sakura', 23, 23], ['estrella', 21, 21], ['moneda', 24, 24], ['cerezas', 18, 17]]
    .map(([n, w, h], i) => `<img src="assets/${n}.svg" alt="" width="${w}" height="${h}" style="--i:${i}">`).join('');
  const anteriores = resto.map((n) => `
    <li class="novedad">
      <details>
        <summary><span class="nov-pill">v${esc(n.version)}</span><span lang="es">${esc(n.titulo)}</span><time datetime="${n.fecha}">${fecha(n.fecha)}</time></summary>
        <ul lang="es">${n.cambios.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      </details>
    </li>`).join('');
  vista.innerHTML = `
    <section class="pagina angosta">
      <h1 class="display">${t('nov_titulo')}</h1>
      <article class="nov-hero">
        <div class="nov-confeti" aria-hidden="true">${confeti}</div>
        <p class="nov-etiqueta">${ICON.brillo}<span>${t('nov_nueva')}</span></p>
        <p class="nov-version">v${esc(ultima.version)}</p>
        <h2 lang="es">${esc(ultima.titulo)}</h2>
        <p class="nov-fecha"><time datetime="${ultima.fecha}">${fecha(ultima.fecha)}</time></p>
        <ul class="nov-cambios" lang="es">${ultima.cambios.map((c, i) => `<li style="--i:${i}">${ICON.check}<span>${esc(c)}</span></li>`).join('')}</ul>
      </article>
      ${resto.length ? `<h2 class="nov-sub">${t('nov_anteriores')}</h2><ol class="novedades">${anteriores}</ol>` : ''}
    </section>`;
  sonido.fin();
}
