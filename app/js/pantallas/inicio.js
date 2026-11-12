// ---------- Inicio: entrar / crear cuenta / invitado ----------
import { t, nombreIdioma, IDIOMAS_UI } from '../i18n.js';
import * as store from '../store.js';
import { ICON } from '../iconos.js';
import { $, $$, esc, vista, toast, ir } from '../ui.js';
import { S, setS, guardar, cuentaPendiente, setCuentaPendiente, subirYa, conectarGoogle, aplicarAjustes } from '../estado.js';
import { cambiarNativo } from '../marco.js';

export function vistaInicio() {
  let modo = 'entrar';
  vista.innerHTML = `
    <section class="inicio">
      <div class="inicio-hero">
        <img class="inicio-kitty" src="assets/caras/feliz.svg" alt="Kitty" width="80" height="64">
        <h1 class="marca-completa"><span class="logo apilado"><span class="logo-a">Polykat</span></span><span class="marca-linea" aria-hidden="true"></span><span class="eslogan">Be fluent in multiple languages</span></h1>
      </div>
      <div class="card inicio-card">
        <div class="seg" role="tablist">
          <button role="tab" type="button" data-modo="entrar" aria-selected="true">${t('login_entrar')}</button>
          <button role="tab" type="button" data-modo="crear" aria-selected="false">${t('login_crear')}</button>
        </div>
        <form id="f-login" novalidate>
          <label class="campo"><span>${t('login_usuario')}</span>
            <input name="usuario" autocomplete="username" maxlength="30" required></label>
          <label class="campo"><span>${t('login_clave')}</span>
            <input name="clave" type="password" minlength="6" autocomplete="current-password" aria-describedby="ayuda-clave" required>
            <small id="ayuda-clave">${t('login_clave_min')}</small></label>
          <p class="error" id="login-error" role="alert"></p>
          <button class="btn primario ancho" type="submit" id="btn-login">${t('login_entrar')}</button>
        </form>
        <div class="separador"><span>${t('login_o')}</span></div>
        <button class="btn ancho" type="button" id="btn-google">${ICON.google}<span>${t('login_google')}</span></button>
        <button class="btn fantasma ancho" type="button" id="btn-invitado">${t('login_invitado')}</button>
        <p class="suave centro pequeno">${t('login_invitado_nota')}</p>
      </div>
      <label class="campo inicio-idioma"><span>${t('idioma_nativo')}</span>
        <select id="inicio-nativo">${IDIOMAS_UI.map((c) => `<option value="${c}" ${c === S.ajustes.nativo ? 'selected' : ''}>${esc(nombreIdioma(c, c))}</option>`).join('')}</select>
      </label>
    </section>`;

  $$('.seg [role=tab]').forEach((b) => b.addEventListener('click', () => {
    modo = b.dataset.modo;
    $$('.seg [role=tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('#btn-login').textContent = t(modo === 'entrar' ? 'login_entrar' : 'login_crear');
    $('[name=clave]').autocomplete = modo === 'entrar' ? 'current-password' : 'new-password';
  }));
  $('#inicio-nativo').addEventListener('change', (e) => cambiarNativo(e.target.value));

  const continuar = (nombre = '') => {
    S.perfil.elegido = true;
    if (nombre) S.perfil.nombre = nombre;
    guardar();
    ir(S.aprendiendo ? '#/menu' : '#/idiomas');
  };
  $('#f-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const usuario = String(f.get('usuario') || '').trim();
    const clave = String(f.get('clave') || '');
    const err = !usuario ? t('login_error_usuario') : clave.length < 6 ? t('login_error_clave') : '';
    $('#login-error').textContent = err;
    if (err) return;
    // Las cuentas reales necesitan un servidor (ver docs/RECOMENDACIONES.md). La contraseña no se guarda.
    toast(t('login_pronto'));
    continuar(usuario);
  });
  $('#btn-google').addEventListener('click', conectarGoogle);
  $('#btn-invitado').addEventListener('click', () => continuar());
}

// ---------- ¿Qué avance conservo? ----------
function cuentaDeMuestra() {
  const demo = store.estadoInicial();
  demo.tokens = 240; demo.ejercicios = 180;
  demo.racha = { actual: 12, mejor: 15, ultimoDia: store.diaLocal(Date.now()) };
  demo.progreso = { en: Object.fromEntries(Array.from({ length: 95 }, (_, i) => [`demo${i}`, { c: 1, d: 0, v: 1, a: 1, f: 0 }])) };
  return demo;
}

export function vistaConservar(r) {
  const demo = r.q.get('demo') === '1';
  const cuenta = demo ? cuentaDeMuestra() : cuentaPendiente; // avance de la cuenta de Google
  if (!cuenta || (!demo && !store.hayConflicto(cuenta, S))) return void (location.hash = '#/aprender');
  const linea = (est) => t('cons_linea', store.resumen(est));
  vista.innerHTML = `
    <section class="pagina angosta">
      <h1 class="display">${t('cons_titulo')}</h1>
      <p class="suave">${t('cons_texto')}</p>
      ${demo ? `<p class="aviso">${t('cons_demo')}</p>` : ''}
      <div class="opciones-avance">
        <button class="opcion" data-eleccion="cuenta">${ICON.usuario}<strong>${t('cons_cuenta')}</strong><span>${esc(linea(cuenta))}</span></button>
        <button class="opcion" data-eleccion="navegador">${ICON.libro}<strong>${t('cons_navegador')}</strong><span>${esc(linea(S))}</span></button>
      </div>
    </section>`;
  $$('.opcion').forEach((b) => b.addEventListener('click', () => {
    if (!demo) {
      const perfil = { ...S.perfil };
      setS(store.elegirAvance(cuenta, S, b.dataset.eleccion));
      S.perfil = { ...S.perfil, cuenta: perfil.cuenta, elegido: true };
      setCuentaPendiente(null);
      aplicarAjustes(); store.guardar(S); subirYa(true);
    }
    else toast(`✓ ${b.querySelector('strong').textContent}`);
    ir('#/aprender');
  }));
}
