# Agendador · Junta Directiva AEMATEC

Página para encontrar un espacio común para las sesiones (virtuales) de la Junta Directiva. Reemplaza a Rallly y las encuestas de WhatsApp.

## Cómo funciona

1. **Secretaría/presidencia entra con la clave** ("Soy de secretaría / presidencia", al final de la página de inicio). Desde ahí puede editar la lista de miembros y **crear una votación**: título, días (fechas concretas, máximo 7, o "horario semanal fijo" de lunes a domingo), duración (1, 1,5 o 2 h) y rango de horas (por defecto de 9:00 am a 11:00 pm).
2. **Se comparte el enlace** por WhatsApp.
3. **Cada miembro toca su nombre** (sin contraseña) y **pinta su disponibilidad** en una cuadrícula de bloques de 30 minutos:
   - **Puedo** (turquesa) o **Si es necesario** (rayado amarillo).
   - Los botones **M / T / N** de cada día marcan de un toque toda la mañana (9–12), la tarde (12–6) o la noche (6–11). Un segundo toque los borra.
   - Al arrastrar se pinta el rectángulo entre la celda donde empezaste y la actual. Si la primera celda ya tenía ese pincel, el arrastre borra.
   - Se guarda solo, al soltar.
4. **Resultados**: las 5 mejores ventanas de la duración pedida, sin traslaparse, con quién puede, quién "si es necesario" y quién no. Debajo hay un mapa de calor; al tocar un bloque se ven los nombres.
5. **Admin fija el horario**: aparece el aviso "Sesión fijada" y un enlace a Google Calendar.

### Por qué una sola cuadrícula y no dos votaciones

Antes de construir se investigaron herramientas (Rallly, Doodle, When2meet, LettuceMeet, Crab Fit, Timeful, Framadate) y métodos de decisión. La idea de votar primero franjas ("Lunes en la tarde") y luego la hora exacta obliga a hacer dos rondas, y entre una y otra se pierde gente. Los atajos M/T/N dan esa misma rapidez de franja en la misma pantalla donde se puede afinar por bloques, así que todo queda en una sola votación.

**Puntaje de una ventana** = personas que pueden + 0,5 × "si es necesario". Una persona cuenta como "puede" solo si marcó **todos** los bloques de la ventana.

## Puesta en marcha (una sola vez)

Sin configurar, la app corre en **modo demo**: los votos quedan solo en tu navegador, lo que sirve para probarla.

### 1. Firebase (base de datos + clave de admin, gratis)

Proyecto: `agendador-839ba` (ya configurado en `config.js`).

1. **Firestore**: **Compilación → Firestore Database → Crear base de datos** → modo **producción**.
2. **Reglas**: en Firestore → pestaña **Reglas**, pega el contenido de [`firestore.rules`](firestore.rules) y presiona **Publicar**. Así:
   - cualquiera puede ver las votaciones y votar (solo su disponibilidad, y solo si la votación está abierta);
   - crear, fijar, reabrir, borrar y editar la lista de miembros requiere la clave de admin.
3. **Clave de admin**: **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar**. Luego, en la pestaña **Usuarios → Agregar usuario**:
   - correo: `admin@aematec.app` (debe coincidir con `correoAdmin` en `config.js`; no tiene que ser un correo real);
   - contraseña: **la clave que usarán secretaría y presidencia**.

   La clave vive solo en Firebase y no aparece en el código. Para cambiarla: Authentication → Usuarios → ⋮ → Restablecer contraseña, o borra el usuario y créalo de nuevo con la clave nueva.
4. **Dominios autorizados**: Authentication → Configuración → Dominios autorizados → agrega `aematec.github.io`.

> La `apiKey` de Firebase no es secreta: es normal que esté en el código. La seguridad está en las reglas.

### 2. `config.js`

- `correoAdmin`: el correo de la cuenta de admin del paso 3.
- `miembros`: la lista inicial de la junta. Después se edita desde **Panel de administración** en la página de inicio (se guarda en Firestore). Los nombres aparecen como botones para votar con un toque y permiten mostrar quién falta por votar.

### 3. Publicar en GitHub Pages

Repositorio: <https://github.com/AEMATEC/Agendador> (**Settings → Pages → Deploy from a branch → `main` / root**). Cada `git push` a `main` publica en <https://aematec.github.io/Agendador/>.

## Desarrollo local

Los módulos ES necesitan servidor HTTP (no funciona abriendo el archivo con doble clic):

```bash
python -m http.server 8080
```

Prueba de la lógica de ranking:

```bash
node test.mjs
```

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura y estilos (colores de la web de AEMATEC, Montserrat) |
| `app.js` | Vistas, cuadrícula, almacenamiento (Firestore o demo) |
| `logic.js` | Lógica pura: ventanas, ranking y formato de horas |
| `config.js` | Firebase, correo de admin, miembros iniciales |
| `firestore.rules` | Reglas de seguridad (se pegan en la consola de Firebase) |
| `test.mjs` | Prueba de `logic.js` |
| `logo.svg` | Compás de AEMATEC |

## Pendiente / ideas

- **Disponibilidad recurrente guardada por persona**: llenarla una vez por semestre y en cada votación solo ajustar las excepciones. Es el siguiente paso natural hacia la sesión fija.
- Quórum mínimo (por ejemplo, "al menos 6 de 8") como filtro en los resultados.
