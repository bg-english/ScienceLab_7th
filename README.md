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
| `firebase/functions/index.js` | Cloud Functions — AI tutor + AI exercise generator (Groq proxy) |
| `firebase/firestore.rules` | Firestore security rules (students own their data, teacher reads all) |
| `firebase/firebase.json` / `.firebaserc` | Firebase project config for deployment |
| `build_app.ps1` | Copies the apps into a synced folder |

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
- **Teacher dashboard** — live real-time tracking, skill heatmap, weakness analysis,
  section comparison, notices with read receipts, intervention (AI help) logs, CSV export

---

## Setup (Firebase + Groq)

The app works offline immediately (Learning, Practice, Flashcards, Exam).
To activate the cloud (leaderboard, teacher dashboard, AI), do this:

### 1. Create the Firebase project (5 min)

1. Go to **https://console.firebase.google.com** with any Google account.
2. **Add project** → name it (e.g. `scilab-7th`) → Create.
3. **Authentication** → *Get started* → **Sign-in method** → enable **Anonymous** → Save.
4. **Firestore Database** → *Create database* → **Production mode** → region near you.
5. **Project settings (⚙️) → Your apps → Web app (`</>`)** → register the app →
   copy the `firebaseConfig` object.
6. Paste those 6 values into **both** `index.html` and `teacher.html` (the
   `FIREBASE_CONFIG` object at the top of each file). The apiKey of Firebase is
   public by design — it is not a secret.

### 2. Apply the security rules (2 min)

1. In Firebase Console → **Firestore Database → Rules** → paste the contents of
   `firebase/firestore.rules` → Publish.
2. To give yourself (the teacher) admin access: create a document in the `admins`
   collection whose ID is your Firebase uid. Your uid appears in the Authentication
   tab after you open the app once, or use the console user list.

### 3. Deploy the AI functions (5 min)

1. Create a free API key at **https://console.groq.com** → API Keys.
2. In a terminal (PowerShell), from the `firebase` folder:

```
cd "C:\BOSTON FLEX\SCIENCE PROJECTS\firebase"
npm install
npm install -g firebase-tools
firebase login
firebase use --add
firebase functions:secrets:set GROQ_API_KEY
firebase deploy --only functions
```

When prompted for the secret value, paste your Groq API key. It is stored in
Google Secret Manager — it never appears in the app code.

### 4. Publish the app

The site is hosted on GitHub Pages: **https://bg-english.github.io/ScienceLab_7th/**
(updated automatically when you push). The teacher dashboard is at
**https://bg-english.github.io/ScienceLab_7th/teacher.html**

---

## Security model (Firestore rules)

- Students sign in **anonymously** — each gets a stable uid on their device.
- Students can read/write **only their own** score document (the document id is
  their uid). They cannot see or modify other students' data.
- Only the teacher (document in `admins`) can read the whole class, post notices,
  and read AI-help logs.
- The Groq key lives only in Google Secret Manager — never in the client.
- All database/user data is HTML-escaped before rendering (no stored XSS).

### Known limitation / next milestone
XP is still computed client-side, so a student could edit their own browser
storage. For a truly cheat-proof leaderboard, the next step is a server-authoritative
scoring function (a Cloud Function that verifies answers and awards XP).