# SciLab — Handoff / Continuación del trabajo

> **Léeme primero si abres una nueva sesión en otra computadora.**
> Este archivo documenta TODO lo hecho y lo que falta, para retomar el trabajo sin perder contexto.

---

## 1. Resumen del proyecto

**SciLab** — App educativa gamificada para **7º grado de Science (Boston Flex)**, 2º trimestre.
Temario: Fotosíntesis (Lev 26:4-6), Respiración vegetal (Gen 9:3) y Sistema respiratorio humano (Sal 150:6).

- **Repo GitHub:** https://github.com/bg-english/ScienceLab_7th (público, rama `master`)
- **Página en vivo (GitHub Pages):** https://bg-english.github.io/ScienceLab_7th/
- **Dashboard del profesor:** https://bg-english.github.io/ScienceLab_7th/teacher.html
- **Carpeta local del proyecto:** `C:\BOSTON FLEX\SCIENCE PROJECTS`

---

## 2. Qué se construyó (historia completa)

1. **Cloné el repo original** `bg-english/Future_and_conditionals` (app de Inglés de 8º, FutureLab) para replicar su arquitectura y diseño.
2. **Leí el temario** `7th GRADE NEWS SCIENCE.docx` (3 lecciones, fechas, versículos, objetivos).
3. **Construí la app de estudiante** (`index.html`): 9 vistas, 12 habilidades, 60 preguntas, 16 flashcards, 4 prompts de escritura, examen de 12 preguntas, sistema XP/niveles/rachas/22 insignias, tutor IA y generador de ejercicios por IA.
4. **Construí el dashboard del profesor** (`teacher.html`): seguimiento en tiempo real, heatmap, análisis de debilidades, avisos con recibos de lectura, logs de ayuda IA, exportar CSV.
5. **Seguridad aplicada:**
   - Corregí el bug de las flashcards (Good/Okay/Hard estaban invertidos).
   - Escape HTML de todos los datos renderizados (XSS almacenado).
   - Endurecí las funciones de IA (validación, anti prompt-injection, rate-limit, errores genéricos).
   - La app no llama a la nube cuando no está configurada (mensajes amigables, sin 404).
6. **Migración Supabase → Firebase** (el proyecto Supabase antiguo `gfjiicfnwpkbkptwgnte` fue eliminado y no se podía reutilizar; además Firebase no tiene el límite de 2 proyectos del plan free de Supabase):
   - `index.html` y `teacher.html` usan ahora Firebase (auth anónima por dispositivo, Firestore, Cloud Functions).
   - Creé `firebase/functions/index.js` (IA con Groq) y `firebase/firestore.rules` (cada alumno solo toca su propia fila; el docente lee todo).

---

## 3. Estado actual

- ✅ App del estudiante: **funciona al 100% offline** (Learn, Practice, Flashcards, Exam, Write, Reinforce).
- ✅ **Firebase configurado** (proyecto `scilab-7th`): auth anónima, Firestore `(default)`, reglas publicadas, doc `admins/{uid}` del profesor activo.
- ✅ Leaderboard, sincronización y dashboard del profesor: **funcionando**.
- ⏳ Tutor IA y generador de ejercicios IA: **esperan la clave de Groq y el deploy de Cloud Functions** (Paso 3 abajo).

### Bugs corregidos el 2026-08-19 (sesión de configuración Firebase)

1. **`teacher.html` no tenía `</script>` de cierre** al final del archivo → el navegador nunca ejecutaba el JavaScript del dashboard (spinner infinito, cero peticiones a Firebase). Fix: cerrar la etiqueta antes de `</body>`.
2. **`teacher.html` nunca se autenticaba** (no había `signInAnonymously`) → con reglas que exigen auth, toda consulta daba "Missing or insufficient permissions". Fix: login anónimo automático antes de `refreshData()`.
3. **Reglas con bug de lectura**: `isOwner(resource.data)` no funciona (un mapa no tiene `.id`). Fix: `isOwner(resource)` en la regla de lectura de `/scores`.
4. **Base duplicada `default`** (sin paréntesis): la app usa `(default)`. Se eliminó la base errónea.
5. **UID de `admins` debe coincidir con la sesión anónima del navegador** que abre `teacher.html` (obtener con `auth.currentUser.uid` en la consola; la sesión se guarda en localStorage del navegador, una por navegador/dispositivo).

## 4. LO QUE FALTA (pasos del usuario / profesor)

### Paso 1 — Crear el proyecto Firebase (5 min)
✅ **HECHO 2026-08-19** — proyecto `scilab-7th` creado, auth anónima activada, Firestore `(default)` creada en `us-central`, firebaseConfig pegado en `index.html` y `teacher.html`.

### Paso 2 — Aplicar las reglas de seguridad (2 min)
✅ **HECHO 2026-08-19** — reglas publicadas en `(default)` (con el fix `isOwner(resource)`), doc `admins/{uid}` del profesor creado.

### Paso 3 — Desplegar la IA con Groq (5 min) — **ÚNICO PASO QUE FALTA**
1. Crear API key gratis en https://console.groq.com → API Keys.
2. En la terminal (PowerShell), desde la carpeta `firebase`:
```
cd "C:\BOSTON FLEX\SCIENCE PROJECTS\firebase"
npm install
npm install -g firebase-tools
firebase login
firebase use --add
firebase functions:secrets:set GROQ_API_KEY
firebase deploy --only functions
```
La clave de Groq se guarda en Google Secret Manager, nunca en el código.

### Paso 4 — Listo
- El leaderboard, la sincronización y el dashboard del profesor empiezan a funcionar solos.
- La URL del profesor: https://bg-english.github.io/ScienceLab_7th/teacher.html

---

## 5. Notas técnicas importantes

- **Roster de estudiantes:** en `index.html` hay un objeto `ROSTER` con nombres de ejemplo (`Student Blue 1`...). Reemplazar por la lista real de 7º Blue/Red antes de usarlo en clase.
- **Estructura de datos en Firestore:**
  - `scores/{uid}` — estado completo de cada estudiante (una fila por alumno).
  - `interventions/{auto}` — logs de ayuda IA.
  - `notices/{auto}` — mensajes del profesor.
  - `notice_reads/{auto}` — recibos de lectura.
  - `admins/{uid}` — cuentas con acceso de docente.
- **Cómo se prueba localmente:** abrir `index.html` con doble clic (funciona offline) o servirlos con `npx serve`.
- **Sincronización de copias:** `build_app.ps1` copia `index.html` y `teacher.html` a la carpeta `Science_7th_Project/` (por convención del repo original). Ejecutarlo tras editar los archivos raíz.

---

## 6. Pendientes de desarrollo futuro (opcional)

- **Puntuación en servidor** (que un Cloud Function verifique respuestas y otorgue XP) para que nadie edite su navegador y falsee el leaderboard.
- Mover el contenido (preguntas, lecciones) a Firestore con un panel de administración para escalar como enciclopedia educativa.
- Repetición espaciada (SM-2) en las flashcards.
- Analítica de aprendizaje avanzada en el dashboard del profesor.

---

*Documento creado el 2026-08-18. Actualizar si hay cambios importantes.*