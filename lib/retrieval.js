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

// A real curriculum topic heading looks like "Strand 2. Algebraic Reasoning"
// or "Sub-Strand 1. Applications of...". Everything else that our generic
// PDF chunker might have mistaken for a heading — repeating page headers
// ("24 | MATHEMATICS"), front-matter sections (Foreword, Vision, Writers),
// learning-indicator codes ("1.1.LI.1 1.1.AS.1"), or bare equation
// fragments ("AUB = BUA") — gets filtered out here before it ever reaches
// the student's topic picker.
const STRAND_PATTERN = /^sub-?strand\s+\d+|^strand\s+\d+/i;

function isJunkHeading(h) {
  const text = h.trim();
  if (text.length < 4) return true; // "U", "B ="
  if (/^\d+\s*\|/.test(text) || /\|\s*\d+$/.test(text)) return true; // "24 | MATHEMATICS"
  if (/[=∩∪]/.test(text)) return true; // equation fragments
  if (/^(\d+\s*\.?\s*)+(li|as|lo)\b/i.test(text)) return true; // "1.1.LI.1 1.1.AS.1"
  if (/^dok\s*\d*(\s*dok\s*\d*)*$/i.test(text)) return true; // "DOK 1 DOK 2"
  if (/^(cs\s*lo\s*li\s*)+$/i.test(text)) return true;
  const FRONT_MATTER = [
    "foreword", "acknowledgements", "acknowledgement", "introduction", "philosophy",
    "vision", "rationale", "contextual issues", "writers", "reviewers", "uew",
    "curriculum writing guide team", "external quality assurance team",
    "the shs curriculum overview", "mathematics", "lhs=rhs",
  ];
  if (FRONT_MATTER.includes(text.toLowerCase())) return true;
  return false;
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

  const allHeadings = [
    ...new Set(
      index.chunks
        .map((c) => (c.heading || "").trim())
        .filter((h) => h && h.toLowerCase() !== "general")
    ),
  ];

  // Prefer real Strand/Sub-Strand headings when the document uses that
  // structure (NaCCA documents do). Falls back to the generic noise filter
  // if the document doesn't use Strand/Sub-Strand wording at all, so this
  // still works for other countries' differently-structured PDFs.
  const strandHeadings = allHeadings.filter((h) => STRAND_PATTERN.test(h));
  const topics = strandHeadings.length > 0 ? strandHeadings : allHeadings.filter((h) => !isJunkHeading(h));

  if (topics.length === 0) return null;
  return { topics, source: index.source };
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
