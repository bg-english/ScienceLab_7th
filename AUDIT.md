# SciLab — Auditoría Completa (Mapa Técnico)

> **Fecha:** 2026-08-19 · **Versión auditada:** 2.2.1 (commit `650bd7f`)
> **Propósito:** Mapa exhaustivo de la app: arquitectura, datos, funciones,
> entradas/salidas, errores, flujos, servicios externos y seguridad, para poder
> "ver a través de la app" y diagnosticar qué ocurrió, cuándo y cómo.

---

## 1. Alcance y método

- Archivos auditados: `index.html` (app estudiante, 1588 líneas), `teacher.html`
  (dashboard, 1370 líneas), `firebase/functions/index.js` (3 funciones),
  `firebase/firestore.rules`, `firebase/firestore.indexes.json`, `firebase.json`,
  `HANDOFF.md`, `CHANGELOG.md`.
- Método: lectura línea a línea + trazado manual de cada flujo + verificación
  lógica de reglas de seguridad vs. llamadas del cliente.

---

## 2. Arquitectura

```
[GitHub Pages]  https://bg-english.github.io/ScienceLab_7th/
   ├─ index.html      ──► app ESTUDIANTE (estáticos, sin build)
   └─ teacher.html    ──► app PROFESOR (dashboard)
        │
        │ (Firebase JS SDK compat v10.12.0 — https y 443)
        ▼
[Firebase project "scilab-7th" — us-central1]
   ├─ Authentication   (signInAnonymously)
   ├─ Firestore (default)  ── colecciones: admins, sections, students,
   │                           scores, interventions, notices, notice_reads
   └─ Cloud Functions (v2, us-central1)
        ├─ scienceExplainTopic        (Groq)
        ├─ scienceGenerateExercises   (Groq)
        └─ studentLogin               (verificación sección+PIN)
              │
              │ (HTTPS 443, POST https://api.groq.com/openai/v1/chat/completions)
              ▼
        [Groq API]  modelo openai/gpt-oss-20b  (clave en Secret Manager)
```

---

## 3. Modelo de datos (Firestore)

| Colección | Doc ID | Campos | Quién escribe (reglas) |
|---|---|---|---|
| `admins/{uid}` | uid de Firebase Auth | (cualquiera) | solo teacher (isTeacher) |
| `sections/{id}` | auto o `blue`/`red` | `name`, `code`, `subjects[]`, `createdAt` | solo teacher |
| `students/{id}` | auto | `name`, `sectionId`, `code`(PIN 4 díg), `email`, `parents[{name,phone,email}]`, `createdAt` | solo teacher |
| `scores/{docId}` | = uid del alumno | `uid, studentId, name, studentName, section, sectionId, sectionName, xp, totalXp, level, streak, answered, correct, examScore, bestExamScore, badges[], mastery{}, skillLvl{}, cardBox{}, updatedAt` | el propio alumno (uid = docId) o teacher |
| `interventions/{auto}` | auto | `uid, name, section, skill, confusion, response, level, createdAt` | el propio alumno (create); lectura teacher |
| `notices/{auto}` | auto | `message, active, createdAt` | teacher |
| `notice_reads/{auto}` | auto | `noticeId, uid, name, section, readAt` | el propio alumno (create); lectura teacher |

Índice compuesto existente: `notices(active ASC, createdAt DESC)`.

---

## 4. Inventario de funciones

### 4.1 App ESTUDIANTE (`index.html`)

| Función | Línea | Entrada | Salida / Efecto | Errores posibles |
|---|---|---|---|---|
| `toastError` | 398 | msg | toast rojo | — |
| `initFirebase` | 427 | — | inicializa SDK | fallo SDK → warn |
| `ensureAuth` | 436 | — | `signInAnonymously` → myUid | fallo red → false |
| `esc`/`escAttr` | 449/450 | string | HTML escapado | — |
| `go(id)` | 523 | id de vista | cambia vista + renderiza | — |
| `renderHUD` | 542 | — | nivel/XP/racha | — |
| `addXP(n)` | 544 | n | XP + subida de nivel | — |
| `checkSkillBadges` | 615 | skill | insignias por habilidad | — |
| `award(id)` | 633 | badge | insignia + sync | — |
| `checkBadges` | 634 | — | insignias globales | — |
| `recordAnswer` | 651 | skill, correct | mastery + XP skill | — |
| `buildQueue` | 837 | mode, focusSk | cola adaptativa | — |
| `startPractice` | 855 | mode, focusSk | inicia ronda | error → mensaje |
| `renderItem` | 868 | — | pinta pregunta | — |
| `submitAnswer` | 906 | optIdx | evalúa, feedback, XP, sync | — |
| `checkFill` | 933 | — | valida respuesta escrita | — |
| `quitRound` | 946 | btn | confirma 2 toques | — |
| `trackWrong` | 958 | skill | contador de fallos → intervención IA | — |
| `showIntervention` | 967 | skill | modal tutor IA | — |
| `logIntervention` | 988 | skill, confusion, response | Firestore add | — |
| `submitIntervention` | 1001 | skill | llama `scienceExplainTopic` | error red/IA |
| `renderPracticeSetup` | 1039 | — | pills de práctica | — |
| `renderDash` | 1060 | — | home | — |
| `renderLearn`/`openLesson` | 1105/1117 | id | lecciones | — |
| `renderDeck`/`openFlashcard` | 1139/1152 | id | flashcards | — |
| `rateCard` | 1171 | grade(-1/0/1) | Leitner + XP | — |
| `renderReinforce` | 1202 | — | teoría por habilidad | — |
| `renderWrite`/`openWrite`/`submitWriting` | 1221-1247 | — | escritura + XP | — |
| `renderExamIntro`/`startExam`/`renderExamQ`/`examAnswer`/`finishExam` | 1252-1307 | — | examen + nota | — |
| `loadBoard` | 1309 | — | lee `scores` (list) → ranking | error red/reglas |
| `loginStudent` | 1366 | sección + PIN | llama `studentLogin` | fallo callable |
| `confirmLogin` | 1408 | perfil | guarda localStorage + sync | — |
| `switchProfile` | 1430 | — | cierra sesión local | — |
| `buildSyncBody` | 1443 | — | objeto de sync | — |
| `doSync` | 1467 | — | `scores/{uid}.set` | fallo → "offline" |
| `syncToFirestore`/`syncNow` | 1474/1480 | — | sync diferido/inmediato | — |
| `watchNotices` | 1496 | — | onSnapshot `notices(active,desc)` | fallo feed |
| `ackNotice` | 1514 | id | `notice_reads.add` | fallo |

### 4.2 App PROFESOR (`teacher.html`)

| Función | Línea | Entrada | Salida / Efecto | Errores |
|---|---|---|---|---|
| `toast`/`toastError` | 339/347 | msg | toasts + dedupe | — |
| `initFirebase` | 375 | — | SDK (app "scilab-teacher") | fallo SDK |
| `render()` | 482 | — | todo el dashboard | — |
| `refreshData` | 827 | — | `scores.get()` → tabla | fallo red/reglas |
| `exportCSV` | 853 | — | CSV descargable | — |
| `sendNotice`/`clearNotice` | 882/903 | msg | batch desactivar + add | fallo red |
| `loadReadReceipts` | 929 | — | avisos + reads | fallo |
| `loadInterventions` | 987 | — | `interventions` desc | fallo |
| `showPanel` | 1025 | dash/admin | cambiar panel | — |
| `loadSections` | 1042 | — | `sections.get()` (+seed blue/red) + `students.get()` | **permiso → toast** |
| `renderSectionsList` | 1070 | — | lista de secciones | — |
| `openSecForm` | 1086 | id | rellena form | — |
| `saveSec` | 1097 | nombre, código, materias | `sections.add`/`.update` | **permiso → "check connection"** |
| `delSection` | 1113 | id | borra sección + alumnos | — |
| `selectSection`/`loadStudents` | 1136/1143 | secId | `students.where(sectionId)` | — |
| `addStudent` | 1255 | nombre, email, PIN, padres | `students.add`/`.update` | **permiso → "check connection"** |
| `bulkAddStudents` | 1289 | lista de nombres | batch `students.add` | permiso |
| `exportCodesCSV` | 1309 | — | CSV de códigos | — |
| `startListeners` | 1330 | — | onSnapshot scores/interventions/sections | fallo feed |
| arranque | 1348 | — | `signInAnonymously` → refresh → loadSections | **uid nuevo por dispositivo** |

### 4.3 Cloud Functions (`firebase/functions/index.js`)

| Función | Entrada | Salida | Errores (HttpsError) |
|---|---|---|---|
| `scienceExplainTopic` | `{skill, confusion, level}` | `{explanation, skillName}` | failed-precondition (sin clave), unavailable (Groq), invalid-argument |
| `scienceGenerateExercises` | `{skill?, level, mastery, count, seenQuestions}` | `{exercises[]}` (sk/q/o/a/fb) | idem |
| `studentLogin` | `{sectionCode, code}` | `{ok:true, studentId, name, sectionId, sectionName, sectionCode, subjects}` o `{ok:false, error}` | unauthenticated, invalid-argument |

---

## 5. Flujos end-to-end (trazados)

### 5.1 Login del estudiante
1. `loginStudent()` → valida formato (sección no vacía, PIN `^\d{4}$`).
2. `httpsCallable('studentLogin')` → el servidor busca `sections.where(code==SEC)` y
   `students.where(sectionId, code==PIN)`.
3. Devuelve nombre/sección → pantalla "¿Eres tú?" → `confirmLogin()` guarda en
   localStorage y llama `ensureAuth()` (anónimo) → `syncToFirestore()`.

### 5.2 Login del profesor / acceso al panel
1. `teacher.html` al cargar → `signInAnonymously()` (uid NUEVO por dispositivo/navegador).
2. `refreshData()` → `scores.get()` (requiere `isTeacher()` para list).
3. `loadSections()` → `sections.get()` (requiere `isTeacher()`).
4. **Si el uid actual NO está en `admins/` → PERMISSION DENIED en todo.**

### 5.3 Práctica
1. `startPractice` → `buildQueue` (prioriza habilidades débiles) → `renderItem`.
2. `submitAnswer` → `recordAnswer` (mastery+XP) → `addXP` → feedback → `syncToFirestore`.
3. 2 fallos seguidos → `showIntervention` → `submitIntervention` → Groq.

### 5.4 Sincronización
- `doSync()`: `scores/{myUid}.set(body, merge)`. Frecuencia: diferida 1.5 s tras cada acción.
- Regla de escritura: `uid == docId && request.resource.data.uid == auth.uid`.

### 5.5 Avisos
- Profesor: `sendNotice` → desactiva los activos (batch) + `notices.add({active:true})`.
- Alumno: `watchNotices` (onSnapshot) → barra → `ackNotice` → `notice_reads.add`.

---

## 6. Servicios externos y "puertos"

| Servicio | Dominio/Endpoint | Puerto/Proto | Motivo |
|---|---|---|---|
| GitHub Pages | bg-english.github.io | 443/TLS HTTPS | hosting estático |
| Firebase Auth | identitytoolkit.googleapis.com / scilab-7th.firebaseapp.com | 443 | login anónimo |
| Firestore | firestore.googleapis.com (us-central1) | 443 | base de datos |
| Cloud Functions | us-central1-scilab-7th.cloudfunctions.net | 443 | callables |
| Groq | api.groq.com/openai/v1/chat/completions | 443 | IA (clave servidor) |
| Google Fonts / gstatic | fonts.googleapis.com, www.gstatic.com | 443 | tipografías |
| Firebase SDK CDN | www.gstatic.com/firebasejs/10.12.0/* | 443 | librerías |

No hay puertos abiertos locales; todo es HTTPS saliente del navegador.

---

## 7. Seguridad (estado actual)

- **Reglas Firestore:** `sections` y `students` son teacher-only; `scores` list
  compartida para leaderboard, escritura propia; `notices` lectura autenticada.
- **XSS:** todo dato de BD/usuario pasa por `esc()` antes de `innerHTML`.
- **Secretos:** `GROQ_API_KEY` solo en Secret Manager (Cloud Functions). La
  apiKey de Firebase es pública por diseño.
- **⚠️ Punto débil principal:** la identidad del profesor depende de un **uid
  anónimo por dispositivo** (ver hallazgo F1).

---

## 8. Hallazgos (bugs y riesgos)

### 🔴 F1 — CRÍTICO: No se puede crear sección/alumno en un equipo nuevo
- **Síntoma reportado:** al intentar crear un alumno pedía crear sección antes;
  al crear la sección, "no funcionó" (no guardaba).
- **Causa raíz:** `teacher.html` firma con `signInAnonymously()`. El uid anónimo
  es **único por dispositivo/navegador**. El doc `admins/{uid}` fue creado en la
  OTRA computadora con su uid. En este equipo el profesor tiene un uid nuevo →
  `isTeacher()` es falso → `sections.add()`/`students.add()` devuelven
  `permission-denied`. El `catch` de `saveSec`/`addStudent` muestra
  "Could not save — check connection." (mensaje engañoso; el error real es
  permiso denegado).
- **Reproducción:** abrir `teacher.html` en un navegador/dispositivo sin el
  uid de `admins`, entrar al panel "Sections & Students", crear sección.
- **Impacto:** el profesor no puede administrar secciones/alumnos fuera del
  equipo original. En el equipo original sí funciona.
- **✅ CORREGIDO (2.2.2):** nuevo login de profesor con **PIN maestro** vía
  Cloud Function `teacherLogin`. Si el dispositivo no está en `admins`, el
  dashboard pide el PIN maestro; al acertar, la función promueve el uid actual
  a `admins/`, así funciona en CUALQUIER equipo/navegador.

### 🟠 F2 — Login anónimo no es identidad persistente
- Aunque el mismo navegador conserva el uid (persistencia LOCAL por defecto),
  borrar datos / otro navegador / otra máquina = uid nuevo. La "promoción" a
  profesor por uid en `admins` es frágil.
- **✅ Mitigado (2.2.2):** el PIN maestro promueve el uid del dispositivo actual;
  el docente ya no depende de un equipo concreto.

### 🟠 F3 — Mensajes de error engañosos en el panel de profesor
- `saveSec`/`addStudent`/`loadSections` capturan el error y muestran
  "check connection" cuando en realidad es `permission-denied`. Imposible
  diagnosticar sin abrir la consola del navegador.
- **✅ CORREGIDO (2.2.2):** nuevo `fbErrHint(e)` muestra el código real de
  Firebase y la solución (p.ej. "Permission denied — use the teacher PIN").

### 🟡 F4 — `loadSections` hace seed automático de blue/red
- Si está vacía, inserta `sections/blue` y `sections/red` en un batch. Si el
  profesor no es admin, ese batch también falla (silencioso).

### 🟡 F5 — Anti-cheat inexistente (conocido)
- XP/notas calculadas en el cliente; un alumno puede editar `localStorage` y
  subir `scores/{uid}` con valores falsos (su propia fila, regla lo permite).

### 🟡 F6 — Sin rate-limit en `studentLogin`
- Callable sin límite; un atacante podría probar PINs (fuerza bruta de 4 dígitos,
  ~10k combinaciones) contra el código de sección. Mitigación recomendada:
  limitar intentos por uid/IP o añadir delay.

### 🟢 Observación — `loadBoard` usa `db.collection('scores').get()`
- Regla `list` permite a todo autenticado leer la lista → leaderboard correcto.

---

## 9. Cómo "ver a través de la app" (trazabilidad)

Para diagnosticar qué pasó:
1. **Consola del navegador (F12 → Console):** los errores muestran
   `permission-denied`, `FirebaseError: [code=...]`, `studentLogin error`, etc.
   Todos los `catch` hacen `console.warn`/`console.error`.
2. **Firebase Console → Firestore:** revisar `sections`, `students`, `scores`,
   `admins` para confirmar qué datos existen y sus uids.
3. **Firebase Console → Authentication:** listar uids anónimos (solo el que está
   en `admins` tiene permisos de profesor).
4. **Firebase Console → Functions → Logs:** ver ejecución de
   `studentLogin`/`scienceExplainTopic`/`scienceGenerateExercises` (logs de Groq
   y errores).
5. **Groq Console:** métricas de uso de la clave.

---

## 10. Recomendaciones (priorizadas)

1. **F1/F2 — Identidad estable del profesor:** implementar login de profesor con
   **PIN maestro** validado por una Cloud Function `teacherLogin` que (al acertar)
   escriba `admins/{uid}` del llamador. Así, en cualquier equipo, el profesor
   entra con un PIN maestro una vez y queda admin. (Alternativa: login por
   email/contraseña de Firebase.)
2. **F3 — Mejorar errores:** en `saveSec`/`addStudent`/`loadSections`, mostrar el
   `code` real de Firebase (p.ej. `permission-denied`) y sugerir la solución.
3. **F6 — Proteger `studentLogin`:** rate-limit por uid/IP (1 intento cada 2 s;
   bloquear tras 5 fallos por sección).
4. **F5 — Puntuación en servidor** (hito futuro).
5. Documentar en `HANDOFF.md` cualquier cambio nuevo.

---

*Fin de la auditoría. Actualizar con cada cambio relevante.*
