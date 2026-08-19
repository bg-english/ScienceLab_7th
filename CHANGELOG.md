# SciLab — CHANGELOG

All notable changes to SciLab (7th Grade Science App) are documented here.

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