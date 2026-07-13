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
  const chunks = chunkText(rawText);

  const outDir = path.join(__dirname, "..", "syllabus-index");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slugify(country)}-${slugify(subject)}.json`);

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

  console.log(`Indexed ${chunks.length} chunks from "${pdfPath}" -> ${outPath}`);
  console.log("Redeploy (or restart `next dev`) for the tutor to pick this up.");
}

// Splits raw PDF text into chunks, trying to detect heading-like lines
// (Strand/Sub-Strand headings only — see note below on why the heuristic
// was tightened).
function chunkText(rawText) {
  const rawLines = rawText
    .split("\n")
    .map((l) => l.trim())
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
  const headingPattern = /^(strand|sub-strand)\s+\d+/i;

  const chunks = [];
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
      currentHeading = line.slice(0, 120);
      continue;
    }
    buffer.push(line);
    const wordCount = buffer.join(" ").split(/\s+/).length;
    if (wordCount >= MAX_WORDS_PER_CHUNK) {
      flush();
    }
  }
  flush();

  return chunks;
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

main().catch((err) => {
  console.error("Ingestion failed:", err.message);
  process.exit(1);
});
