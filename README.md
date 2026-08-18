# SciLab — 7th Grade Science Study App

Gamified, single-page Science learning platform for **7th-grade students at Boston Flex**.
Covers the **Second Term** Science temario:

1. **Photosynthesis: What do plants eat?** *(May 25–26)* — God is in control of the creation (Leviticus 26:4–6)
2. **Plants Breathing System (Respiration)** *(June 15–16)* — Genesis 9:3
3. **Take Care of the Respiratory System** *(July 27–28)* — "Everything that breathes, praise the LORD!" (Psalm 150:6)

Built as a direct adaptation of the **FutureLab / Future_and_conditionals** repo
(same design layer, XP/badge system, teacher dashboard and AI tutoring), re-themed
for Science and for a younger audience.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Student app (all-in-one HTML: styles + logic) |
| `teacher.html` | Teacher dashboard (real-time analytics, notices, CSV) |
| `supabase/schema.sql` | Database tables + security policies |
| `supabase/functions/science-explain-topic/index.ts` | AI tutor (explains a topic) |
| `supabase/functions/science-generate-exercises/index.ts` | AI exercise generator |
| `build_app.ps1` | Copies the apps into a synced folder |
| `CHANGELOG.md` | Version history |

---

## Features

- **9 views**: Home, Learn, Practice, Flashcards, Reinforce, Write, Exam, Leaderboard
- **12 skills** mapped to the temario:
  Photosynthesis Process · What Plants Eat · Plant Food & Products · Chlorophyll & Leaves ·
  Stomata & Gas Exchange · Plant Respiration · Root Respiration · Respiratory Organs ·
  Breathing Mechanism · Gas Exchange in Lungs · Respiratory Care · Respiratory Vocabulary
- **XP / Levels / Streaks / Badges** — fully gamified (13 global + 9 per-skill badges)
- **Smart Review** — mistakes are saved and re-queued
- **Flashcards** with Leitner boxes (Box 1 → 5 = mastered)
- **AI Tutor** — after 2 wrong answers on a topic, a modal lets the student ask the AI
  to explain it (in English or Spanish). Uses **Groq** (fast + free tier).
- **AI-generated exercises** — adaptive, focused on the student's weak skills
- **Writing lab** — the meaningful learning experiences (song, poster, model report)
- **Final exam** with best-score tracking
- **Teacher dashboard** — live tracking, skill heatmap, weakness analysis, section
  comparison, notices with read receipts, intervention (AI help) logs, CSV export

---

## 1. Set up Supabase (backend)

1. Create a free project at **https://supabase.com** (the free tier is enough).
2. In the dashboard, open **SQL Editor** and run the contents of
   `supabase/schema.sql`. This creates the tables:
   - `sciencelab_scores` — student state
   - `sciencelab_interventions` — AI help logs
   - `sciencelab_notices` / `sciencelab_notice_reads` — teacher messages
3. Copy your project **URL** (`https://xxxx.supabase.co`) and **anon public key**
   from **Settings → API**.
4. Paste them into **both** `index.html` and `teacher.html`:
   - `const SB_URL = 'https://YOUR-PROJECT.supabase.co';`
   - `const SB_KEY = 'YOUR-ANON-KEY';`
   - (`teacher.html` uses `SUPABASE_URL` / `SUPABASE_KEY`)

## 2. Deploy the AI functions (Groq)

1. Get a free API key at **https://console.groq.com** (free tier: ~1M tokens/day —
   more than enough for a classroom; it is also extremely fast).
2. Install the Supabase CLI: `npm install -g supabase`
3. From the project folder:
   ```
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set GROQ_API_KEY=your_groq_key
   supabase functions deploy science-explain-topic --no-verify-jwt
   supabase functions deploy science-generate-exercises --no-verify-jwt
   ```

## 3. Edit the class roster

In `index.html`, find the `ROSTER` object and replace the placeholder names
(`Student Blue 1…`, `Student Red 1…`) with your real 7th Blue and 7th Red lists.

## 4. Serve the app

Just open `index.html` in a browser, or host it anywhere (GitHub Pages, Netlify,
Vercel, or a school web server). The teacher opens `teacher.html`.

---

## AI provider notes (why Groq)

The original repo used Supabase Edge Functions with a hosted LLM. This version
uses **Groq** because it is:

- **Fast** — Llama 3.3 70B answers in under a second
- **Cheap / free** — a generous free tier, no credit card needed
- **Simple** — one API key, one endpoint, compatible with OpenAI-style requests

Swap to another provider (Gemini Flash, OpenRouter, DeepSeek) by editing the
`model` and `url` inside the two edge-function files.