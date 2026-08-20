# SciLab — CHANGELOG

All notable changes to SciLab (7th Grade Science App) are documented here.

## [4.0.0] — 2026-08-19 — "Evaluación formativa + habilidades lingüísticas"

### Added — Research & design
- **`RESEARCH.md`**: estudio de tipos de pregunta del mercado educativo, mecánicas
  de gamificación que producen conocimiento (retrieval practice, repetición
  espaciada, interleaving…), habilidades R/L/S/W aplicadas a Science (CLIL),
  alineación con evaluaciones internacionales (PISA, Cambridge YLE/Key, WIDA,
  TOEFL Junior, Common Core, NGSS) y diseño de dashboards por habilidad.

### Added — New question types (each item now declares its skillType)
- **True/False** (`tf`), **Ordering/sequencing** (`order`), **Listening** (`listen`,
  audio vía TTS), **Speaking** (`speak`, modelo TTS + autoevaluación).
- 78 ítems en total: 48 mc, 12 fill, 6 tf, 4 order, 4 listen, 4 speak.
- `skillType` (R/L/S/W) derivado automáticamente para ítems previos.

### Added — Anti-cheat completo (banco en servidor)
- El banco de preguntas vive ahora en el servidor (`functions/items.js`).
- `scienceVerifyAnswer` callable: verifica cada respuesta (mc/fill/tf/listen)
  contra el banco autoritativo, puntúa en transacción (XP, mastery por tema Y por
  habilidad R/L/S/W) y devuelve el veredicto; el cliente adopta los totales.
- Fallback offline seguro (registrado en el log) si no hay conexión.

### Added — Dashboards por tipo de habilidad
- Estudiante (Home): "Your Language Skills in Science" con barras R/L/S/W.
- Profesor (Dashboard): heatmap estudiante × R/L/S/W + precisión de clase por
  habilidad. `skillTypeMastery` se guarda en cada score y se sincroniza.

## [3.0.0] — 2026-08-19 — "Depuración + Policía Interno"

### Added — System log (internal police)
- **`logEvent` Cloud Function:** every transaction in both apps is recorded with
  military precision (what was requested, what happened, how, and why if it
  failed), validated, rate-limited (240/min/uid), and stored in `/logs`.
- **`rotateLogs` scheduled function:** daily summaries in `/log_daily` + purges
  logs older than 45 days (keeps the store lightweight).
- **Logger in both apps:** batched/debounced, fire-and-forget; emits events for
  login, practice, exam, flashcards, writing, AI, sync, notices, section/student
  management and dashboard errors.
- **Diagnostics panel** in the teacher dashboard (🛡️): KPIs (entries, errors,
  warnings, success rate, avg latency), error trend per day, filters, detail
  view on hover, and **JSONL export** (lightweight, machine-readable log file).
- **`recordAnswer` Cloud Function (anti-cheat):** server-authoritative scoring
  with bounded, monotonic increments in a transaction; the client adopts the
  server totals.

### Fixed (from audit)
- **F4:** seed of Blue/Red sections is now visible/logged (no silent failures).
- **F5:** leaderboard inflation via localStorage is mitigated server-side.
- **F6:** brute-force protection on `studentLogin` (8 attempts/min per uid,
  20/min per section code).

### Setup required
- Redeploy functions and set the master PIN + GROQ key:
  ```
  cd "C:\BOSTON FLEX\SCIENCE PROJECTS\firebase"
  firebase functions:secrets:set TEACHER_PIN
  firebase functions:secrets:set GROQ_API_KEY
  firebase deploy --only functions
  ```
- `rotateLogs` is scheduled — requires the Blaze plan (already active).

## [2.2.2] — 2026-08-19

### Added
- **Teacher master-PIN login** (`teacherLogin` Cloud Function): on a new
  device/browser the dashboard shows a "Teacher access" gate. Entering the
  master PIN promotes the current device's anonymous uid to `admins/`, so the
  teacher can manage sections/students from ANY computer (fixes the silent
  "could not create section/student" bug on devices other than the original).

### Fixed
- **F1:** creating a section/student failed silently on new devices — the
  teacher's anonymous uid was not in `admins/` and Firestore denied writes.
  Now solved with the PIN gate above.
- **F3:** misleading "check connection" errors replaced with `fbErrHint()` which
  shows the real Firebase error code and the fix (e.g. permission-denied).

### Setup required
- Set the master PIN and redeploy:
  `firebase functions:secrets:set TEACHER_PIN` (respond "yes" to redeploy).

## [2.2.1] — 2026-08-19

### Added
- **Student contact details** in the Students panel: student email, and for up to
  two parents/guardians their full names, phones and emails (all optional). All
  values are editable per student (new ✏️ edit button), shown in the students
  table, and included in the Codes CSV export.

### Fixed
- `addStudent` crashed with `ReferenceError: _editingStuId` (used before
  declaration) — the save button appeared to fail.

## [2.2.0] — 2026-08-19

### Added
- **Sections & Students management (teacher dashboard)**: new "Sections & Students"
  panel. The teacher creates sections (name + login code + subjects list), adds
  students individually or in bulk, sees their personal PINs, exports a codes CSV,
  and deletes sections (cascade with students). Blue/Red are seeded automatically
  on first use, so existing leaderboard data keeps working.
- **Secure student login (student app)**: students log in with their **section code
  + personal PIN** via the new `studentLogin` Cloud Function (server-side lookup —
  the `sections`/`students` registries are teacher-only in Firestore rules). Before
  entering, the app shows a confirmation screen with the student's full name,
  section and subjects ("This is you?") so the profile can never be someone else's
  by mistake.
- **Switch profile chip** in the student header: "👤 Name · switch" re-opens the
  login screen (useful on shared devices).
- `scores` docs now carry `studentId`, `sectionId`, `sectionName`, `studentName`.
- Teacher dashboard is fully section-dynamic: filter buttons, section weakness
  comparison and comparison cards render from the `sections` collection.

### Changed
- Replaced the old pick-your-name roster (which let any student take any name)
  with the code-based login.

## [2.1.5] — 2026-08-19

### Fixed
- **Browser warning "Blocked aria-hidden... because its descendant retained
  focus"**: navigating away from a view (e.g. Reinforce → Practice) hid the
  view with `aria-hidden` while the just-clicked button still held focus.
  `go()` now blurs the active element when it lives inside a view before
  hiding it. Verified in a headless DOM (focus falls back to body).

## [2.1.4] — 2026-08-19

### Fixed
- **Answering questions threw "The token provided must not be empty"** (reported
  from class): in practice and in the exam, the feedback loop added `''` to
  `classList` for options that were neither correct nor selected, and
  `classList.add('')` throws a `SyntaxError` — aborting `submitAnswer` before
  showing feedback and before recording the answer/XP (it existed since the
  initial release). Now only `correct`/`wrong` classes are added when they
  apply. Verified end-to-end in a headless DOM: correct and wrong answers
  advance the round, update state, XP and Smart Review, in both practice and
  exam.

## [2.1.3] — 2026-08-19

### Fixed
- **"Quit round" button did nothing**: it used the native `confirm()` dialog,
  which is silently blocked (returns false) on many mobile browsers/webviews.
  Replaced with an in-app two-tap confirmation ("Quit round" → "⚠️ Tap again
  to quit" → quits; auto-disarms after 3 s). Works everywhere, no dialogs.

## [2.1.2] — 2026-08-19

### Fixed
- **Science Ranking (leaderboard) showed "Missing or insufficient permissions"**:
  the read rule `isOwner(resource)` only works for single-document `get`
  queries, but the leaderboard is a `list` query over the whole `scores`
  collection (in list queries `resource` doesn't exist, so it was always
  denied). Rules now `allow get` on own doc only, and `allow list` for any
  authenticated student (the leaderboard is shared by design). Verified live
  as an anonymous student: list OK, own-doc get OK, other students' docs
  still denied, own writes OK.

## [2.1.1] — 2026-08-19

### Fixed
- **Practice buttons did nothing outside the Practice view** (reported by the
  teacher in class): the lesson page pills ("Photosynthesis Process", etc.),
  the "Practice everything →" button, the Reinforce skill buttons and the
  dashboard "Suggested focus" banner all called `startPractice()`, which
  rendered the question into the *hidden* Practice view without navigating.
  `startPractice()` now navigates to the Practice view first (`go('practice')`).
  Verified with headless DOM tests (jsdom).

## [2.1.0] — 2026-08-19

### Added
- **Error toasts in both apps**: every error now shows a toast with its type
  (`⚠️` via `toastError`, global `window.onerror` + `unhandledrejection`
  handlers, throttled to avoid spam). Covers JS errors, sync/offline, leaderboard,
  AI tutor, notices, read receipts, interventions and sign-in failures.

### Fixed
- **Firestore rules**: students could not read `scores` (leaderboard broken).
  The published rules still used the broken `isOwner(resource.data)` form —
  republished with `isOwner(resource)`. Verified in live tests.
- **Notices query failed** with "missing composite index" — added and deployed
  `firebase/firestore.indexes.json` (`notices`: active ASC + createdAt DESC).
- **AI exercise generator returned 0 exercises for count=10** (output truncated
  at max_tokens 1600): now requests `{"exercises":[...]}` JSON, `max_tokens: 3200`,
  retries once on parse failure, and uses a robust `parseExerciseJson` /
  `repairJson` parser (8 unit tests, all passing). Full sets now return reliably.
- **teacher.html mojibake**: 41 double-encoded emoji characters (badges,
  buttons, notices) restored to proper emoji (verified 0 remaining).
- **teacher.html averages**: students with 0 answers no longer count as 0%
  accuracy in class/section averages (`avgAcc`, `compCard`).
- Removed dead code from index.html (`fetchAIExercises`, `sessionMode`,
  `maxTier`, `avgSkLv`, `hintUsed`, `idx`, `_staticExhausted`, `_activeView`)
  and renamed the misleading `syncToSupabase` → `syncToFirestore`.

### Chores
- Added `.gitignore` (node_modules, logs, stray root lockfile).
- README: "9 views" → 8; AI generator wording clarified.

## [2.0.0] — 2026-08-18

### Changed
- **Backend migrated from Supabase to Firebase** (Google):
  - The old Supabase project used by the English app (`gfjiicfnwpkbkptwgnte`) was
    deleted, so it could not be reused.
  - Firebase avoids Supabase's free-tier project limit (quotas are per project
    and Google allows many projects per account).
  - Data now lives in Firestore (`scores`, `interventions`, `notices`,
    `notice_reads`, `admins`).
  - Realtime updates use Firestore listeners (native, no polling).
  - Students use Firebase Anonymous Auth (stable per-device uid) instead of
    name-picking + tokens.
  - AI functions are now Cloud Functions (`scienceExplainTopic`,
    `scienceGenerateExercises`) proxying Groq, with the Groq key stored in
    Google Secret Manager.
- Removed the obsolete `supabase/` folder and its schema files.
- README rewritten with the complete Firebase + Groq setup.
- The app no longer attempts cloud calls when Firebase is not configured — it
  shows a friendly setup message instead of a connection/404 error.

### Security (applied)
- Firestore security rules: students can only read/write their own score;
  only the teacher can read the class, post notices, and read AI-help logs.
- HTML-escaped rendering of all user/database data (stored XSS fixed).
- Cloud Functions validate inputs, guard against prompt injection, and return
  generic errors (no internals leaked).

### Fixed
- Flashcard rating buttons were inverted (Hard advanced the box, Okay demoted it) —
  now Good/Okay/Hard work correctly with differentiated XP.

## [1.0.0] — 2026-08-18

### Added
- Initial release adapted from FutureLab / Future_and_conditionals.
- Student app with 9 views, 12 Science skills, XP/badges/streaks, smart review,
  Leitner-box flashcards, writing lab, final exam, AI tutor (Groq via Supabase
  Edge Functions at the time), teacher dashboard with CSV export.
- Supabase schema + two Edge Functions.