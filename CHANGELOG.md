# SciLab — CHANGELOG

All notable changes to SciLab (7th Grade Science App) are documented here.

## [1.0.0] — 2026-08-18

### Added
- Initial release adapted from FutureLab / Future_and_conditionals.
- Student app (`index.html`) with 9 views: Home, Learn, Practice, Flashcards,
  Reinforce, Write, Exam, Leaderboard.
- 12 Science skills mapped to the Second Term temario:
  - Lesson 1 — Photosynthesis: What do plants eat? (May 25–26, Leviticus 26:4–6)
  - Lesson 2 — Plants breathing system (June 15–16, Genesis 9:3)
  - Lesson 3 — Take care of the respiratory system (July 27–28, Psalm 150:6)
- Gamification: XP, levels, streaks, 13 global + 9 per-skill badges.
- Practice engine with adaptive queue + Smart Review.
- Flashcards with Leitner boxes (Box 1 → 5).
- Writing lab with the 3 meaningful learning experiences + extra prompt.
- 12-question final exam with best-score tracking.
- AI Tutor intervention (after 2 wrong answers) via Supabase Edge Function + Groq.
- AI adaptive exercise generation via Supabase Edge Function + Groq.
- Supabase sync (`sciencelab_scores`), notices with read receipts, leaderboard.
- Teacher dashboard (`teacher.html`): live realtime tracking, skill heatmap,
  weakness analysis, section comparison, intervention logs, CSV export.
- `supabase/schema.sql`, two edge functions, `build_app.ps1`, `README.md`.

### Notes
- Placeholder rosters — replace `ROSTER` in `index.html` with real student lists.
- `SB_URL` / `SB_KEY` placeholders must be set before going live.
- Requires internet for Google Fonts and the Supabase/Groq services.