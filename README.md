# Learn With Glory

*(began life as a personal project called "Glory, Be My Teacher")*

A senior-high study companion for Ghana, Nigeria, UK, and USA students, built as an
installable, offline-capable web app (PWA), powered by Groq for the AI teacher.

## What's real in this version (v1 MVP)

- **Conversational AI tutor** — talks like a real teacher, not a wall of bullet points.
  Streams its reply live. Say "explain differently" any time and it re-teaches the same
  point a new way.
- **10 worked examples per topic**, with a one-tap "10 more examples" button.
- **10-question tappable quiz** per topic, instant Correct/Wrong feedback, running score,
  and a "10 more questions" button at the end.
- **Country → Level → Track → Subject** navigator for Ghana, Nigeria, UK, and USA.
- **Installable PWA** — "Add to Home Screen" on phones, "Install" in Chrome/Edge on
  desktop. Works fully offline for re-reading a lesson already loaded; the AI itself
  needs internet to think (that part can't work offline — no model runs on-device here).

- **Syllabus grounding (RAG), v1** — see the new section below. You feed it real official
  PDFs yourself; the AI then teaches and quizzes from your document, not just its own
  memory, for any subject you've ingested.
- **Tables, bar/line/pie charts, and simple geometric shape diagrams** — the AI decides
  when a visual genuinely helps (e.g. a frequency table, a triangle with labeled sides,
  a bar chart comparing values) and the app renders it inline in the lesson, not as a
  wall of described text.
- **Read-aloud pronunciation** — a 🔊 button on every teacher message and every
  dictionary word, using the browser's free built-in speech engine (no API cost, works
  offline once the page is loaded).
- **Dictionary lookup** — a panel for checking spelling and meaning via the free
  dictionaryapi.dev public API, with pronunciation playback.
- **Leaderboard / competitions (optional)** — after a quiz, students can submit their
  score and see the top 10 for that subject+topic, powered by a free Supabase database.
  This feature quietly disables itself if you haven't set up Supabase yet — nothing
  breaks either way.
- **Word & letter puzzles** — a "🧩 Puzzles" button generates 6 topic vocabulary words
  (tap-the-letters spelling game, with a clue) and 4 topic sentences (tap-the-words
  sentence builder), both scored with instant Correct/Wrong feedback.
- **Student profiles (optional)** — if Supabase is set up, the home page shows a "Who's
  studying?" picker instead of a plain name box, so siblings/classmates sharing one
  deployed link each get their own tracked history. Falls back to a plain name field if
  Supabase isn't set up.
- **Parent/teacher dashboard (optional)** — `/dashboard`: pick a student, see lessons
  studied, quizzes taken, average score, a score-over-time chart, weak topics (last
  score under 70%), and a recent-activity table.
- **Spaced repetition (optional)** — `/review`: any quiz question a student got wrong is
  automatically queued and resurfaces a day later, then further out each time it's
  answered correctly on review (1 → 3 → 7 → 16 → 35 days), until it's "mastered" and
  drops out of the queue. Get it wrong again on review and it resets to day 1.
- **Browsable topic list** — step 5 on the home page is now a tappable list of real
  topics for the chosen subject (pulled straight from an ingested syllabus PDF when
  you've run the ingest step, clearly marked ✔), or a sensible AI-suggested list
  otherwise (marked ⚠, worth double-checking). A separate search box below it (step 6)
  is for typing a specific topic freely, so browsing and searching are two distinct,
  clearly-labeled things instead of one text box doing both jobs.
- **Admin-approved accounts (optional, OFF by default)** — real email+password sign-in,
  with an admin approval gate before someone can use lessons/quizzes/puzzles (they can
  still browse subjects while pending). This is the foundation for a future paid
  subscription: real accounts you control, not just an open link.
- **Textbook-standard lesson structure** — every lesson now follows a mandatory,
  research-based structure (hook → objectives → vocabulary → explanation → visual →
  classification → advantages/disadvantages or causes/effects or uses/applications or
  rules/exceptions (whichever fits) → comparison if two things are commonly confused →
  common mistakes → real-life relevance → summary → 10 worked examples), adapted by
  subject type so Biology gets a labeled diagram and Math gets a plotted graph, the same
  way a real SHS textbook is structured — not just paragraphs.
- **Past Questions portal** (`/past-questions`) — two ways to practice for exams:
  1. Real past papers you legally provide, ingested via `npm run ingest-pq`, browsable
     by year (2020–2026) once loaded.
  2. AI-generated exam-style practice questions, instantly available for any subject,
     clearly labeled as original questions modeled on the real exam's format — not
     reproductions of actual past questions (copyright, same reasoning as the syllabus
     PDFs).

## What's honestly NOT built yet (see "Roadmap" below)

- Syllabus grounding only kicks in for subjects you've personally ingested a PDF for —
  everything else still falls back to the AI's general knowledge (with the honesty
  caveats already built in). Retrieval is simple keyword matching, not a vector/semantic
  search — good enough for a first version, not as smart as it could get.
- Word/sentence puzzles cover vocabulary and simple factual sentences well; they don't
  yet adapt difficulty based on how the student is doing.
- Student profiles have no password/login — anyone with the link can pick any name from
  the list or add a new one. Fine for a family or small classroom; not meant for a
  public-facing deployment without adding real authentication first.
- The leaderboard has deliberately loose anti-cheat: anyone with your Supabase anon key
  (which is public, by design, in any Supabase project) can submit a score. Fine for a
  family or small school; if this grows into something public-facing, move score
  submission behind a server-side API route with real validation.

## Syllabus grounding — feed it a real official document

This is the accuracy upgrade. Instead of the AI teaching purely from memory, you give it
your own downloaded copy of an official syllabus PDF, and it quotes and teaches from
that document specifically.

**Important — copyright:** this app does **not** ship or download anyone's copyrighted
curriculum document for you. NaCCA's own PDFs, for example, say "no part of this
publication may be reproduced without prior written permission" — so you get your own
copy directly from the source (nacca.gov.gh, curriculumresources.edu.gh, your exam
board, or your state department of education), and the tool below only indexes *your*
copy, locally, for your own household's study use. It quotes small, relevant excerpts
back to you and your child while teaching — not the whole document.

Steps:

1. Download the official PDF for a subject (e.g. Ghana's Mathematics SHS 1-3 curriculum
   from curriculumresources.edu.gh) and save it somewhere on your computer.
2. Run:
   ```bash
   npm run ingest -- ./path/to/your-file.pdf ghana mathematics
   ```
   (swap `ghana`/`mathematics` for whichever country/subject it covers — it doesn't need
   to match the app's exact subject label; matching is fuzzy, so "mathematics" will be
   found for "Core Mathematics" or "Elective Mathematics" automatically.)
3. This creates a small JSON file in `syllabus-index/`. Commit it to your repo (it's
   just your own extracted-and-chunked index, not the original PDF) and redeploy — or
   just restart `next dev` locally.
4. From then on, whenever a student asks about a topic in that subject, the app looks up
   the most relevant excerpt from your document and tells the AI to teach from it
   specifically, quoting its exact terminology and content standards.
5. Repeat for each subject/country you want grounded. Subjects with no ingested PDF
   still work — they just fall back to the AI's general knowledge, as before.

## Past Questions setup (optional)

`/past-questions` gives students two ways to practice: real past papers you legally
provide, and AI-generated exam-style practice that works instantly for everything else.

**To load a real past paper:**
1. Get your own legal copy of a past exam paper or past-questions compilation (a PDF).
2. Run:
   ```bash
   npm run ingest-pq -- ./downloads/math-2023.pdf ghana mathematics 2023
   ```
3. This creates a JSON file in `past-questions-index/` (extracted page text from your
   PDF, not the PDF itself). Commit it and redeploy.
4. That year now shows "✔ available" on the portal — students can browse it page by
   page, with the source filename shown so it's clear it's your own uploaded document.

**Copyright note:** past exam papers are copyrighted by the exam body (WAEC, NECO, an
exam board, etc.) — this app doesn't source or supply any past papers itself, you
provide your own. If you're loading in real copyrighted content and this deployment is
public, consider turning on the admin-approval gate (below) so it isn't openly
accessible to the whole internet.

**The AI-generated fallback** needs no setup — it's on by default for every subject,
using the same Groq key as everything else. It's clearly labeled as original questions
in the exam's style, not reproductions of real past questions.

## 1. Get a Groq API key

1. Go to https://console.groq.com and sign up.
2. Create an API key.
3. Keep it secret — never put it directly in front-end code.

## 2. Run it locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste your key: GROQ_API_KEY=gsk_xxx
npm run dev
```

Open http://localhost:3000.

## 3. Deploy to Vercel (free tier is fine)

1. Push this folder to a new GitHub repository.
2. Go to https://vercel.com/new and import that repo.
3. In the Vercel project's **Settings → Environment Variables**, add:
   - `GROQ_API_KEY` = your key
   - (optional) `GROQ_MODEL` = a Groq model name, e.g. `llama-3.3-70b-versatile`
4. Deploy. Vercel gives you a URL that works on any phone, tablet, or computer.
5. On a phone: open the URL in Chrome/Safari → menu → "Add to Home Screen." It now opens
   like a real app.

## 4. Curriculum accuracy — read before you rely on this for real study

`lib/curriculum.js` documents exactly which subject lists are sourced from an official
document (Ghana, from NaCCA's own Subject Combinations PDF) versus which are a
reasonable general scaffold you should double-check (Nigeria, UK, USA). The AI is told
this distinction every time it teaches, and is instructed to say "double-check this"
rather than bluff. As you get official syllabus PDFs for other countries/boards, the
next step (see Roadmap) is to feed their actual text into the prompt instead of relying
on the model's general knowledge — that's what turns "probably right" into "verified."

## Leaderboard setup (free, optional)

1. Go to https://supabase.com → sign up (free, no credit card) → "New project."
2. Once it's created, go to the SQL Editor and paste in the contents of
   `supabase/schema.sql` from this repo, then run it. This creates the `leaderboard`
   table with sensible default permissions (anyone can submit/read scores, nobody can
   edit or delete through the public API).
3. Go to Project Settings → API. Copy the "Project URL" and the "anon public" key.
4. Add them as environment variables (locally in `.env.local`, and in Vercel's
   Environment Variables for deployment):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```
5. Redeploy (or restart `next dev`). The "Submit my score" button and leaderboard now
   appear automatically after every quiz — no code changes needed.

**Also run `supabase/schema_v2_history.sql`** the same way (SQL Editor → paste → Run) to
add student profiles, the dashboard, and spaced repetition — they all reuse this same
Supabase project, no second account needed.

If you skip this section entirely, the app still works fine; the leaderboard section
just doesn't render.

## Admin approval / gated access (optional, OFF by default)

This turns the app from "open to anyone with the link" into "sign up, then wait for an
admin to approve you" — the natural first step before a paid subscription. It's fully
opt-in and doesn't touch anything else if you don't turn it on.

1. In Supabase's SQL Editor, run `supabase/schema_v3_auth.sql` (after the two schema
   files above).
2. Go to Project Settings → API. Copy the **`service_role`** secret key (different from
   the `anon` key you already copied — this one is powerful, never share it or put it in
   client-side code).
3. In Vercel → your project → Environment Variables, add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
   NEXT_PUBLIC_REQUIRE_APPROVAL=true
   ```
4. Redeploy.
5. Visit your site and sign up once, using your own real email — this is how you'll
   become the admin.
6. In Supabase's SQL Editor, run (with your actual email):
   ```sql
   update public.profiles set role = 'admin', status = 'approved'
   where email = 'you@example.com';
   ```
7. Sign in again (or refresh) and visit `/admin` — you can now approve, reject, or
   promote any account that signs up.

**What "pending" users can and can't do:** they can sign up, sign in, and browse the
country/level/subject/topic picker freely. The moment they try to start a lesson, take a
quiz, or do a puzzle, the AI politely tells them their account is awaiting approval —
this is enforced on the server (not just hidden in the interface), so it can't be
bypassed by a technically savvy user poking at the API directly.

**Turning it back off:** set `NEXT_PUBLIC_REQUIRE_APPROVAL` back to `false` (or delete
it) and redeploy — the app goes back to fully open access instantly.

**What this is NOT yet:** actual payment collection. This gate controls *access*, not
*billing*. Adding real subscriptions (Stripe or similar) to automatically approve paying
customers is a separate, sizeable next step — happy to scope that whenever you're ready
to pick a payment provider and pricing.

## Roadmap (in priority order)

1. ~~Syllabus grounding (RAG)~~ — done in v1, see above. Next refinement: swap the
   simple keyword-matching retrieval for real semantic/vector search once you have many
   subjects ingested, so it finds the right excerpt even when the student's wording
   doesn't match the document's wording.
2. ~~Diagrams & graphs~~ — done in v1 (bar/line/pie charts, tables, and basic geometric
   shapes with labels). Next refinement: more shape types (angles, coordinate graphs,
   nets of solids) as real topics call for them.
3. ~~Pronunciation & dictionary~~ — done in v1.
4. ~~Word & letter puzzles~~ — done in v1 (letter-tile spelling game + sentence-builder,
   both generated fresh per topic).
5. ~~Competitions~~ — done in v1 via Supabase (see above). Next refinement: filter the
   leaderboard by school/region if you want smaller, more meaningful competition groups
   instead of one global list per subject+topic.
6. ~~Parent/teacher dashboard~~ — done in v1 (see `/dashboard`).
7. ~~Spaced repetition~~ — done in v1 (see `/review`). Next refinement: a gentle
   in-app reminder/notification when questions become due, instead of relying on
   remembering to check the page.

## Project structure

```
app/
  page.js            – country/level/track/subject/topic navigator
  learn/page.js       – chat lesson + tappable quiz UI
  api/tutor/route.js  – streams the AI teacher's reply from Groq
  api/quiz/route.js   – generates the 10-question quiz as JSON from Groq
lib/
  curriculum.js       – subject data + provenance notes (READ THIS FILE)
  prompt.js           – system prompts that ground and constrain the AI
  retrieval.js        – finds the right syllabus excerpt for a topic
scripts/
  ingest.mjs          – turns YOUR downloaded PDF into a local searchable index
syllabus-index/
  *.json              – generated by the ingest script, safe to commit (your own excerpts)
supabase/
  schema.sql             – run first: leaderboard table
  schema_v2_history.sql  – run second: students, study history, spaced-repetition queue
  schema_v3_auth.sql     – run third (optional): real accounts + admin approval
components/
  VisualBlock.jsx     – renders charts/tables/shapes from the AI's structured output
  SpeakButton.jsx     – 🔊 read-aloud using the browser's free speech engine
  DictionaryPanel.jsx – free dictionary lookup with pronunciation
  Leaderboard.jsx     – submit/view quiz scores (needs Supabase; hides itself otherwise)
  PuzzleGame.jsx      – letter-tile spelling game + tap-the-words sentence builder
  Footer.jsx          – designer/company credit shown on the landing page
  StudentPicker.jsx   – "who's studying?" profile picker (needs Supabase)
  AuthGate.jsx        – sign in/up UI shown when NEXT_PUBLIC_REQUIRE_APPROVAL is on
app/dashboard/page.js – parent/teacher progress dashboard (needs Supabase)
app/review/page.js   – spaced-repetition review session (needs Supabase)
app/admin/page.js    – approve/reject/promote users (needs Supabase + admin role)
app/api/topics/route.js – powers the browsable topic list (syllabus-first, AI fallback)
app/past-questions/page.js – past-questions portal (real papers + AI exam-style practice)
app/api/past-questions/  – list (ungated), view (gated), generate (gated) routes
scripts/ingest-past-questions.mjs – turns your own past-paper PDF into a browsable index
past-questions-index/  – generated by ingest-pq, safe to commit (your own extracted pages)
lib/pastQuestions.js  – reads the past-questions index for the portal
lib/
  spacedRepetition.js – the 1/3/7/16/35-day review interval scheduler
  studentClient.js    – remembers which student profile this device is using
  authClient.js       – browser-side sign up/in/out helpers
  supabaseServer.js   – SERVER-ONLY: verifies who's calling the API + admin checks
public/
  manifest.json, sw.js, icons/ – PWA install + offline shell
```
