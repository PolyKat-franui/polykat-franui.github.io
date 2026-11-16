# Seguridad de Polykat — lista de revisión

Decisión de Francisca (2026-11-16): **cada cambio que toque la nube, el inicio de sesión o datos de
personas se revisa con esta lista antes de publicarse.** Si un punto no se cumple, se dice claramente.

Polykat no tiene servidor propio: es una app web estática (GitHub Pages) que usa **Firebase**
(Authentication + Firestore). Por eso la seguridad está sobre todo en **`firestore.rules`**.

## Estado (revisado el 2026-11-16)

| # | Punto | Estado | Cómo se cumple en Polykat |
|---|---|---|---|
| 1 | Límite de peticiones (*rate limiting*) | 🟡 Parcial | Las reglas limitan **cuánto** cambia cada escritura (en `uso`: +1 día y +1 sesión como máximo; textos con largo máximo). Firestore no permite contar peticiones por persona. **Falta: App Check** (ver «Pendiente»). En el plan gratuito (Spark) un ataque no genera cobros: solo agota la cuota del día. |
| 2 | Claves de API fuera del código público | ✅ | No hay claves secretas. La `apiKey` de `nube-config.js` es la clave **pública** de Firebase para web (Google indica que no es secreta). **Recomendado:** restringirla a los dominios de Polykat (ver «Pendiente»). |
| 3 | Seguridad por fila en cada tabla | ✅ | Cada colección tiene reglas: `progreso/{uid}` solo su dueña o dueño; `ranking/{uid}` cada quien su fila; `uso` y `sugerencias` solo la creadora las lee. |
| 4 | Variables de entorno fuera del repositorio | ✅ | No se usan variables secretas. `.gitignore` excluye registros y `node_modules`. |
| 5 | Validación de lo que se recibe | ✅ | Las reglas validan campos permitidos, tipos y largos. En la app, todo texto de otras personas (nombres del ranking, sugerencias) pasa por `esc()` antes de mostrarse (evita inyección de HTML). |
| 6 | Nada abierto al público por defecto | ✅ | Firestore rechaza todo lo que no tiene regla (probado con una colección inventada). Sin cuenta solo se puede **enviar** una sugerencia y la medición anónima, nunca leer. |
| 7 | Rutas realmente protegidas | ✅ | El buzón se oculta en la app, pero la protección real está en las reglas: solo el correo de la creadora **verificado por Google** puede leer `sugerencias` y `uso`. |
| 8 | Errores que no muestran información interna | ✅ | La app muestra mensajes propios («No se pudo cargar…»), nunca el error técnico. |
| 9 | Pantallas de administración o prueba apagadas | ✅ | Se quitó el enlace «(demo)» de Ajustes; la vista de demostración solo funciona en el computador de desarrollo (`localhost`). El buzón es la única pantalla de administración y depende de las reglas (punto 7). |
| 10 | Registros para detectar ataques | 🟡 Parcial | Firebase muestra el uso diario (lecturas y escrituras) en la consola. **Falta:** revisarlo cada semana y, si se pasa al plan de pago, activar alertas de presupuesto. |

## Pruebas

- `NODE_PATH=$(npm root -g) npm run test:reglas` prueba las **reglas reales** en el emulador de Firebase
  (39 casos: quién puede leer, escribir y borrar en cada colección). Requiere una vez:
  `npm i -g firebase-tools @firebase/rules-unit-testing firebase` y Java.
- `npm test` y `npm run test:e2e` prueban la app con una nube simulada.

## Pendiente (lo hace Francisca en la consola, con guía)

1. **Restringir la clave de API** — Google Cloud Console → APIs y servicios → Credenciales → la clave
   «Browser key» → *Restricciones de aplicación: sitios web* → agregar `https://polykat-franui.github.io/*`.
2. **App Check con reCAPTCHA** — solo deja escribir en Firestore a la app verdadera (frena bots y
   envíos masivos). Necesita crear una clave de reCAPTCHA (pública) y un cambio en `nube.js`.
3. **Revisar el uso cada semana** — Firebase → Firestore → pestaña *Uso*. Un salto brusco de
   escrituras es señal de abuso.
4. **Mantener el plan gratuito (Spark)** mientras no haga falta otro: así un ataque no puede generar cobros.
