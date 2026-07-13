#!/usr/bin/env node
// scripts/ingest.mjs
//
// Turns YOUR OWN downloaded copy of an official syllabus PDF into a local,
// searchable JSON index that the AI tutor uses for grounding.
//
// Usage:
//   npm run ingest -- ./downloads/ghana-shs-mathematics.pdf ghana mathematics
//
// This does NOT download or redistribute anyone's copyrighted document —
// you supply the PDF yourself (e.g. from nacca.gov.gh or curriculumresources.edu.gh,
// or your exam board / state education department). The script only extracts
// and locally indexes YOUR copy so the app can quote small, relevant excerpts
// back to you and your child while teaching. Respect the source document's
// own copyright notice (most say "for educational use," not "for redistribution").

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractText } from "./lib/pdfExtractShared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , pdfPath, country, subject] = process.argv;

if (!pdfPath || !country || !subject) {
  console.error("Usage: npm run ingest -- <path-to-pdf> <country-key> <subject-slug>");
  console.error("Example: npm run ingest -- ./downloads/math.pdf ghana mathematics");
  process.exit(1);
}

async function main() {
  const rawText = await extractText(pdfPath);
  const { chunks, debugLines } = chunkText(rawText);

  const outDir = path.join(__dirname, "..", "syllabus-index");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slugify(country)}-${slugify(subject)}.json`);
  const debugPath = path.join(outDir, `${slugify(country)}-${slugify(subject)}.debug.txt`);

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        country,
        subject,
        source: path.basename(pdfPath),
        ingestedAt: new Date().toISOString(),
        chunkCount: chunks.length,
        chunks,
      },
      null,
      2
    )
  );

  // A plain-text dump of every extracted line, with "### HEADING ###" marked
  // next to any line that was recognized as a Strand/Sub-Strand heading.
  // This exists purely for diagnosis when the topic list doesn't look right
  // — open this file, find a section that should have been split up but
  // wasn't, and share those lines so the detection can be corrected against
  // what your PDF actually looks like after extraction, instead of guessing.
  fs.writeFileSync(debugPath, debugLines.join("\n"));

  const headingCount = debugLines.filter((l) => l.startsWith("### HEADING")).length;
  console.log(`Indexed ${chunks.length} chunks from "${pdfPath}" -> ${outPath}`);
  console.log(`Detected ${headingCount} heading(s). Raw text dump for review -> ${debugPath}`);
  if (headingCount < 5) {
    console.log(
      "⚠ That's a low heading count for a full SHS 1-3 syllabus — open the .debug.txt file, " +
        "find where a real Strand/Sub-Strand heading appears in the raw text, and share those " +
        "lines so the detection pattern can be fixed to match your document's actual layout."
    );
  }
  console.log("Redeploy (or restart `next dev`) for the tutor to pick this up.");
}

// Splits raw PDF text into chunks, trying to detect heading-like lines
// (Strand/Sub-Strand headings only — see note below on why the heuristic
// was tightened).
function normalizeLine(l) {
  // Real PDF text extraction often inserts stray spaces around punctuation
  // (e.g. "Strand 2 . ALGEBRAIC" instead of "Strand 2. ALGEBRAIC"), which
  // otherwise causes the exact same heading to be treated as two different
  // ones. Collapse that out before anything else touches the line.
  return l
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function chunkText(rawText) {
  const rawLines = rawText
    .split("\n")
    .map((l) => normalizeLine(l))
    .filter(Boolean);

  // Real PDFs repeat a page header/footer on every single page (e.g.
  // "24 | MATHEMATICS" or a bare page number). Left in, these get
  // mistaken for real headings and flood the topic list with junk — strip
  // them before anything else.
  const lines = rawLines.filter((l) => {
    if (/^\d+\s*\|\s*[a-z\s]+$/i.test(l)) return false; // "24 | MATHEMATICS"
    if (/^[a-z\s]+\s*\|\s*\d+$/i.test(l)) return false; // "MATHEMATICS | 25"
    if (/^\d+$/.test(l)) return false; // bare page number
    return true;
  });

  // Deliberately narrow: only genuine "Strand N." / "Sub-Strand N." lines
  // count as headings. An earlier, looser version of this also treated any
  // short ALL-CAPS line as a heading, which caught front-matter sections
  // (Foreword, Vision, Writers), equation fragments, and learning-indicator
  // codes as if they were real topics — exactly the noise a student
  // shouldn't have to tap through. Content between real headings still
  // gets grouped under "General" and is still searchable/usable for
  // lesson grounding; it just won't appear as a standalone topic button.
  // The "sub\s*-?\s*strand" spacing tolerance matters: PDF extraction can
  // turn "Sub-Strand" into "Sub - Strand" or "Sub Strand" depending on how
  // the original document kerns that word, and a too-strict pattern here
  // silently swallows real sub-topics into the parent strand's body text
  // instead of giving them their own topic button.
  // "strand"/"sub-strand" doesn't have to be the very first character of
  // the line — PDF extraction sometimes glues a stray leading character or
  // bullet onto the start of a heading line. Searching within the first ~6
  // characters catches that without becoming so loose it matches the word
  // "strand" appearing mid-sentence in body text.
  const headingPattern = /^.{0,6}?(sub\s*-?\s*strand|strand)\s+\d+/i;

  const chunks = [];
  const debugLines = [];
  let currentHeading = "General";
  let buffer = [];
  const MAX_WORDS_PER_CHUNK = 220;

  function flush() {
    const text = buffer.join(" ").trim();
    if (text.split(/\s+/).length > 15) {
      chunks.push({
        heading: currentHeading,
        text,
      });
    }
    buffer = [];
  }

  for (const line of lines) {
    if (headingPattern.test(line)) {
      flush();
      // A page number sometimes ends up glued onto the tail end of a
      // heading line (e.g. "SUB-STRAND 2. REAL NUMBER SYSTEM174") because
      // it landed at nearly the same vertical position during extraction.
      // Strip a trailing run of digits so it doesn't become part of the
      // topic's displayed name.
      currentHeading = line
        .replace(/\d{1,4}$/, "")
        .replace(/^[^a-z]*/i, "")
        .trim()
        .slice(0, 120);
      debugLines.push(`### HEADING ### ${line}`);
      continue;
    }
    debugLines.push(line);
    buffer.push(line);
    const wordCount = buffer.join(" ").split(/\s+/).length;
    if (wordCount >= MAX_WORDS_PER_CHUNK) {
      flush();
    }
  }
  flush();

  return { chunks, debugLines };
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

main().catch((err) => {
  console.error("Ingestion failed:", err.message);
  process.exit(1);
});
