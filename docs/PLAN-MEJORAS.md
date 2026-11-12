# Plan de mejoras del prototipo — Polykat

Fecha: 2026-11-12. Plan de acción para mejorar, optimizar y hacer más atractiva la app.
Sigue la ruta SMART de la bitácora: **primero medir y cuidar el contenido; las funciones
llamativas grandes se eligen con las entrevistas de diciembre** (objetivo 3: «las 3 mejoras
mejor evaluadas», al 31 de enero de 2027).

## Estado actual (medido en el repositorio)

| Área | Hoy |
|---|---|
| Banco | 4.996 palabras y frases en 6 idiomas. **Las 24.980 traducciones están en `borrador`.** |
| Ejemplos | Oraciones de ejemplo solo para **998 palabras** (las más usadas). |
| Voz | La app **lee** en voz alta (`app/js/voz.js`), pero no **escucha** a la persona. |
| Medición | ✅ **Medición anónima (2026-11-12):** código al azar en el celular; retorno al día 1, 7 y 30 en el buzón de la creadora. |
| Código | ✅ **Ordenado (2026-11-12):** `main.js` pasó de 2.550 a **95 líneas**; cada pantalla vive en `app/js/pantallas/` y lo compartido en módulos propios. |
| Pruebas | 119 pruebas unitarias + pruebas de punta a punta de app y web. |

## Las mejoras, en orden

### Fase 1 · Base sólida (noviembre–diciembre de 2026)

| # | Mejora | Por qué | Peso | Modelo |
|---|---|---|---|---|
| 1 | ✅ **Hecho:** medición anónima de uso con un código al azar guardado en el celular: retorno al día 1, 7 y 30 y sesiones terminadas. Sin datos personales, con una línea en Ajustes para apagarla (Ley 21.719). | Sin esto no se puede validar nada. Es el objetivo 3. | Media | Opus |
| 2 | **Revisión de las 24.980 traducciones**, en lotes de 500 palabras: detectar errores, género, registro y falsos amigos. Todo sigue como `borrador` hasta que una persona nativa lo confirme. | La confianza en el contenido es la base. | **Pesada** | **Fable 5.2** |
| 3 | **Ejemplos para las ~4.000 palabras que faltan**, en los 6 idiomas (unas 24.000 oraciones), cortos y naturales. | Las personas piden saber *cuándo* usar una palabra (hallazgo H2). | **Pesada** | **Fable 5.2** |
| 4 | ✅ **Hecho:** `main.js` dividido en un módulo por pantalla, sin cambiar lo que ve la persona (Fable 5.2, revisado y con todas las pruebas en verde). | Hace más rápido y seguro todo lo que venga. | **Pesada** | **Fable 5.2** |
| 5 | **Auditoría de seguridad** de `firestore.rules`, del inicio de sesión y del buzón. | Antes de sumar personas y datos. | Media | **Fable 5.2** |

### Fase 2 · Lo más llamativo (enero de 2027, según las entrevistas)

Ideas para elegir con los resultados de diciembre (se implementan las 3 mejor evaluadas):

| Idea | Qué es | Peso | Modelo |
|---|---|---|---|
| **Habla con Kitty** | Repetir la frase en voz alta; el navegador escucha (reconocimiento de voz) y Kitty dice si se entendió. Sin público, sin juicio. Cierra la brecha de **hablar**. | **Pesada** | **Fable 5.2** |
| **Una palabra, seis idiomas en 10 segundos** | Animación que muestra la misma palabra pasando por los 6 idiomas; ideal para compartir. | Liviana | Opus |
| **Tarjeta para compartir** | La palabra del día como imagen elegante (con Kitty) para Instagram y WhatsApp. | Liviana | Opus |
| **Prueba de nivel inicial** | 10 tarjetas para empezar en el nivel justo (A1–C2). | Media | Opus |
| **Desafío semanal y logros** | Meta de la semana, insignias por constancia y por idiomas. | Media | Opus |
| **Recordatorio de racha** | Aviso amable para no perder la racha (con permiso de la persona). | Media | Opus |

### Fase 3 · Crecer (después del piloto del club, 2027)

- **Club en la app:** inscripción a encuentros y entrada con **QR dinámico** (solo si el piloto lo valida).
- **Nuevos idiomas** (japonés, coreano, chino…), con el mismo flujo de revisión que la fase 1. **Pesada · Fable 5.2.**
- **Auditoría de accesibilidad** completa (lectores de pantalla, contraste, teclado).

## Cómo usar Fable 5.2 de forma segura

Fable 5.2 (`claude-fable-5-2`) es el modelo más capaz: conviene reservarlo para tareas
**grandes, largas o delicadas** (las marcadas arriba). Lo demás, con el modelo habitual.

1. **Una tarea = una sesión = una rama = un PR.** Nunca trabajar directo en `main`.
   Si algo no gusta, el PR simplemente no se fusiona.
2. **Empezar en modo plan.** Fable propone un plan y espera tu aprobación antes de tocar código.
3. **Encargo preciso** (ver plantilla abajo): objetivo, archivos, reglas de `CLAUDE.md`,
   cómo se sabe que terminó y qué pruebas deben pasar.
4. **Lotes chicos.** Contenido en lotes de 500 palabras por PR; código por pantalla. Así cada
   cambio se puede revisar de verdad.
5. **Pruebas obligatorias:** `npm test` y `npm run test:e2e` en verde, en local y en CI.
6. **El contenido generado sigue siendo `borrador`.** Nada pasa a `revisada` sin una persona
   nativa o docente. No se agregan ni quitan palabras de `banco/banco_palabras_ingles.tsv`.
7. **Sin secretos:** ninguna clave en el código ni en el chat.
8. **Revisión humana antes de fusionar:** mirar el diff y las capturas; pedir `/code-review`
   en los PR grandes.
9. **Vuelta atrás fácil:** si algo falla después de fusionar, `git revert` del commit del PR.

### Cómo elegir Fable 5.2

- En Claude Code (terminal o escritorio): `/model` y elegir Fable 5.2 para esa sesión.
- En claude.ai/code: elegir el modelo al crear la sesión.
- O pedirle a Claude que lance la tarea en una **sesión nueva con Fable 5.2** (recomendado:
  queda separada, con su propia rama y PR).

### Plantilla de encargo

```
Objetivo: <una frase>.
Contexto: lee CLAUDE.md y .claude/skills/franui/SKILL.md antes de empezar.
Alcance: solo <archivos o carpetas>. No toques <lo que no>.
Reglas: traducciones nuevas como `borrador`; colores y fuentes solo en app/css/tokens.css;
textos de interfaz en los 6 idiomas de app/js/i18n.js; no agregar ni quitar palabras del banco.
Listo cuando: <criterio medible> y `npm test` + `npm run test:e2e` pasan.
Entrega: una rama y un PR con resumen, capturas y lo que no se pudo probar.
Empieza con un plan y espera mi aprobación.
```

## Calendario

| Cuándo | Qué |
|---|---|
| Noviembre 2026 | ~~Medición anónima (1)~~ hecha · auditoría de seguridad (5) · ~~dividir `main.js` (4)~~ hecho |
| Diciembre 2026 | Traducciones lotes 1–5 (2) · ejemplos lotes 1–4 (3) · **entrevistas** |
| Enero 2027 | Las 3 ideas mejor evaluadas de la fase 2 (objetivo 3, al 31 de enero) |
| Febrero 2027 | Prueba con 30 personas nuevas durante dos semanas (objetivo 4) |
| Desde marzo 2027 | Fase 3 según el piloto y los fondos |
