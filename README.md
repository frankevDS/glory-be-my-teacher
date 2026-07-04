# Glory, Be My Teacher

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

## What's honestly NOT built yet (see "Roadmap" below)

- Syllabus grounding only kicks in for subjects you've personally ingested a PDF for —
  everything else still falls back to the AI's general knowledge (with the honesty
  caveats already built in). Retrieval is simple keyword matching, not a vector/semantic
  search — good enough for a first version, not as smart as it could get.
- Word/sentence puzzles cover vocabulary and simple factual sentences well; they don't
  yet adapt difficulty based on how the student is doing.
- A parent/teacher dashboard.
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

If you skip this section entirely, the app still works fine; the leaderboard section
just doesn't render.

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
6. **Parent/teacher dashboard:** track topics covered, quiz scores over time, weak areas.
7. **Spaced repetition:** resurface previously-missed questions a few days later instead
   of only scoring once.

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
  schema.sql          – run once in Supabase's SQL editor to create the leaderboard table
components/
  VisualBlock.jsx     – renders charts/tables/shapes from the AI's structured output
  SpeakButton.jsx     – 🔊 read-aloud using the browser's free speech engine
  DictionaryPanel.jsx – free dictionary lookup with pronunciation
  Leaderboard.jsx     – submit/view quiz scores (needs Supabase; hides itself otherwise)
  PuzzleGame.jsx      – letter-tile spelling game + tap-the-words sentence builder
public/
  manifest.json, sw.js, icons/ – PWA install + offline shell
```
