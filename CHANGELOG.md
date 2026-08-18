# SciLab — CHANGELOG

All notable changes to SciLab (7th Grade Science App) are documented here.

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