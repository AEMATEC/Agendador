# CLAUDE.md

Agendador de sesiones de la Junta Directiva AEMATEC (≈8 personas). Idioma de la UI y del código: español. Ver README.md para uso y despliegue.

## Stack y restricciones

- **Sin build, sin npm, sin framework.** HTML + módulos ES servidos estáticos (GitHub Pages). Mantenerlo así.
- Firestore vía CDN de gstatic (`firebase 10.12.2`), cargado solo si `config.firebase.apiKey` existe; si no, `demo()` usa localStorage con **la misma interfaz** (`lista, ver, crear, votar, editar, borrar`). Cualquier operación nueva debe implementarse en ambos.
- Sin autenticación por diseño (decisión del usuario): nombre libre, clave admin en `config.js` solo como "seguro" anti-error.
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

`python -m http.server 8080` (o la configuración `agendador` de `.claude/launch.json`). Sembrar datos demo escribiendo en `localStorage['agendador-demo']`. Admin: `localStorage.clave = 'aematec'`.
