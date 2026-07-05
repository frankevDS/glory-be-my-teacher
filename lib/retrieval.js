import fs from "node:fs";
import path from "node:path";

const INDEX_DIR = path.join(process.cwd(), "syllabus-index");

function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function loadIndex(country, subject) {
  if (!fs.existsSync(INDEX_DIR)) return null;

  const countrySlug = slugify(country);
  const subjectSlug = slugify(subject);

  // Try an exact filename match first (fast path for "ghana-mathematics.json").
  const exactFile = path.join(INDEX_DIR, `${countrySlug}-${subjectSlug}.json`);
  if (fs.existsSync(exactFile)) {
    try {
      return JSON.parse(fs.readFileSync(exactFile, "utf-8"));
    } catch {
      /* fall through to fuzzy match */
    }
  }

  // Fuzzy fallback: subject names in the app ("Core Mathematics", "Elective
  // Mathematics") won't exactly match what someone typed at ingest time
  // ("mathematics"). Match if one slug contains the other.
  const files = fs.readdirSync(INDEX_DIR).filter((f) => f.startsWith(`${countrySlug}-`) && f.endsWith(".json"));
  for (const f of files) {
    const fileSubjectSlug = f.slice(countrySlug.length + 1, -".json".length);
    if (subjectSlug.includes(fileSubjectSlug) || fileSubjectSlug.includes(subjectSlug)) {
      try {
        return JSON.parse(fs.readFileSync(path.join(INDEX_DIR, f), "utf-8"));
      } catch {
        continue;
      }
    }
  }
  return null;
}

function score(chunk, queryWords) {
  const haystack = (chunk.heading + " " + chunk.text).toLowerCase();
  let s = 0;
  for (const w of queryWords) {
    if (!w) continue;
    if (chunk.heading.toLowerCase().includes(w)) s += 3;
    const occurrences = haystack.split(w).length - 1;
    s += occurrences;
  }
  return s;
}

// Returns { excerpt, source } or null if no local index exists for this
// country/subject (i.e. no PDF has been ingested yet via `npm run ingest`).
// Returns the full list of topic headings from a locally-ingested syllabus
// PDF for this country+subject (see scripts/ingest.mjs), or null if none has
// been ingested yet. Used to populate a real, browsable topic list instead
// of relying on the student to type/guess a topic name.
export function listSyllabusTopics(country, subject) {
  const index = loadIndex(country, subject);
  if (!index || !index.chunks?.length) return null;

  const headings = [
    ...new Set(
      index.chunks
        .map((c) => (c.heading || "").trim())
        .filter((h) => h && h.toLowerCase() !== "general")
    ),
  ];
  if (headings.length === 0) return null;
  return { topics: headings, source: index.source };
}

export function retrieveSyllabusExcerpt({ country, subject, topic }, maxChars = 1600) {
  const index = loadIndex(country, subject);
  if (!index || !index.chunks?.length) return null;

  const queryWords = (topic || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (queryWords.length === 0) return null;

  const ranked = index.chunks
    .map((c) => ({ ...c, _score: score(c, queryWords) }))
    .filter((c) => c._score > 0)
    .sort((a, b) => b._score - a._score);

  if (ranked.length === 0) return null;

  let excerpt = "";
  for (const chunk of ranked) {
    const piece = `[${chunk.heading}]\n${chunk.text}\n\n`;
    if (excerpt.length + piece.length > maxChars) break;
    excerpt += piece;
  }
  if (!excerpt) excerpt = `[${ranked[0].heading}]\n${ranked[0].text}`.slice(0, maxChars);

  return { excerpt: excerpt.trim(), source: index.source };
}
