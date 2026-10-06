# CLAUDE.md

Agendador de sesiones de la Junta Directiva AEMATEC (≈8 personas). Idioma de la UI y del código: español. Ver README.md para uso y despliegue.

## Stack y restricciones

- **Sin build, sin npm, sin framework.** HTML + módulos ES servidos estáticos (GitHub Pages). Mantenerlo así.
- Firestore + Auth vía CDN de gstatic (`firebase 10.12.2`), cargados solo si `config.firebase.apiKey` existe (proyecto `agendador-839ba`). Si no, `demo()` usa localStorage con **la misma interfaz** (`lista, ver, crear, votar, editar, borrar, alCambiarAdmin, entrar, salir, miembros, guardarMiembros`). Cualquier operación nueva debe implementarse en ambos.
- Los miembros votan sin autenticarse: eligen su nombre, sin verificación (decisión del usuario).
- Admin = una sola cuenta de Firebase Auth (`config.correoAdmin`, email/contraseña); la "clave" es su contraseña, que vive solo en Firebase. Los permisos se aplican en `firestore.rules`, que el usuario pega en la consola (no hay CLI de Firebase configurada). Si cambias qué campos escribe un no-admin, actualiza las reglas.
- Miembros: `config/junta.lista` en Firestore; `config.miembros` es solo el valor inicial si ese documento no existe.
- Colores: tokens en `:root` de `index.html`, tomados de aematec.github.io (`--navy #0D2B45`, `--teal #00798A`, `--teal-line #00B5C8`, `--teal-light #39C7D5`). Fuente Montserrat.

## Modelo de datos (colección `votaciones`, un documento por votación)

```
{ titulo, dias: [{id, label}], desde: 9, hasta: 23, duracion: 120, creada: ms,
  cerrada: null | {dia, inicio /*minutos desde 00:00*/},
  votos: { [nombre]: { [diaId]: "0120…" } } }   // 1 char por bloque de 30 min: 0 no, 1 puedo, 2 si es necesario
```

- `dia.id` es `YYYY-MM-DD` (modo fechas) o `lun..dom` (modo semanal). El enlace a Google Calendar solo se muestra con fechas.
- Los votos se escriben con `FieldPath('votos', nombre)` para que nombres con puntos/espacios no rompan la ruta.

## Archivos

- `logic.js`: puro, sin DOM. Cualquier cambio de ranking → actualizar `test.mjs` y correr `node test.mjs`.
- `app.js`: router por hash (`#/`, `#/nueva`, `#/v/<id>`). Cada vista devuelve una función de limpieza. En la votación, los eventos están delegados en `#app` con un `AbortController`. `render()` reescribe `innerHTML` completo y se salta mientras se pinta (`pintando`).
- Pintado: rectángulo desde `origen` hasta la celda actual, aplicado sobre una copia de `mio` del inicio del arrastre. Se guarda en `pointerup`.

## Probar

`python -m http.server 8080` (o la configuración `agendador` de `.claude/launch.json`). Con la `apiKey` puesta se usa el Firebase real; para modo demo, vacía `apiKey` temporalmente. En demo: sembrar en `localStorage['agendador-demo']`, admin con `localStorage['demo-admin'] = '1'`.

Despliegue: push a `main` de github.com/AEMATEC/Agendador → GitHub Pages. **Antes de cada push, sube el `?v=N`** en `index.html` (script) y en los imports de `app.js`. GitHub Pages cachea 10 min, y un `logic.js` viejo con un `app.js` nuevo deja la página en "Cargando…".

## Reglas de negocio

- "Votante" = quien tiene al menos un bloque en 1 o 2 (`votantes()` en `logic.js`). Un voto todo en 0 no cuenta en totales, en "no pueden" ni en "faltan".
- La cuadrícula muestra una semana natural (lun–dom) por vez (`semanas()` en `app.js`). Los días fuera de la votación se dibujan oscurecidos (`.x`) y no se pueden pintar. Máximo 4 semanas por votación.
