# Agendador · Junta Directiva AEMATEC

Página para encontrar un espacio común para las sesiones (virtuales) de la Junta Directiva. Reemplaza a Rallly y las encuestas de WhatsApp.

## Cómo funciona

1. **Secretaría/presidencia crea una votación**: título, días (fechas concretas, máximo 7, o "horario semanal fijo" de lunes a domingo), duración (1, 1,5 o 2 h) y rango de horas (por defecto de 9:00 am a 11:00 pm).
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

### 1. Firebase (base de datos, gratis)

1. Entra a <https://console.firebase.google.com> → **Agregar proyecto** (por ejemplo `agendador-aematec`). Google Analytics no hace falta.
2. En el menú: **Compilación → Firestore Database → Crear base de datos** → ubicación `nam5` → modo **producción**.
3. En la pestaña **Reglas**, pega esto y publica:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /votaciones/{id} { allow read, write: if true; }
     }
   }
   ```
4. En **Configuración del proyecto (⚙) → Tus apps → `</>` (Web)** registra una app (no marques Hosting). Copia el objeto `firebaseConfig` en `config.js`, en el campo `firebase`.

> La `apiKey` de Firebase no es secreta: es normal que quede pública en el código.

### 2. `config.js`

- `claveAdmin`: la clave que usan secretaría y presidencia para crear, fijar y borrar votaciones. **Cámbiala.** Ojo: cualquiera que lea el código la puede ver, así que es solo para evitar errores, no es seguridad.
- `miembros`: los nombres de la junta, por ejemplo `['Angelo', 'María', ...]`. Aparecen como botones para votar con un toque y permiten mostrar quién falta por votar.

### 3. Publicar en GitHub Pages

1. Crea un repositorio (por ejemplo `aematec/agendador`) y sube estos archivos.
2. **Settings → Pages → Deploy from a branch → `main` / root**.
3. Queda en `https://aematec.github.io/agendador/`.

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
| `config.js` | Firebase, clave admin, miembros |
| `test.mjs` | Prueba de `logic.js` |
| `logo.svg` | Compás de AEMATEC |

## Pendiente / ideas

- **Disponibilidad recurrente guardada por persona**: llenarla una vez por semestre y en cada votación solo ajustar las excepciones. Es el siguiente paso natural hacia la sesión fija.
- Quórum mínimo (por ejemplo, "al menos 6 de 8") como filtro en los resultados.
