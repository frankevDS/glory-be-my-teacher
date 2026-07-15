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

  // Two real formats show up in the same document: sometimes the heading is
  // one line ("Strand 2. ALGEBRAIC REASONING"), and sometimes the label and
  // the number+name are on SEPARATE lines entirely — a "Strand" line alone,
  // then "3. GEOMETRY AROUND US" as the very next line. Both are handled
  // below; missing the second form was why entire later sections (Geometry,
  // Data, Probability) were silently vanishing into the general bucket.
  const inlineHeadingPattern = /^.{0,6}?(sub\s*-?\s*strand|strand)\s+(\d+.+)/i;
  const loneLabelPattern = /^(sub\s*-?\s*strand|strand)$/i;
  const numberedNamePattern = /^\d+\.?\s*\S/;

  function cleanHeading(raw) {
    return raw
      .replace(/\d{1,4}$/, "")
      .replace(/^[^a-z]*/i, "")
      .replace(/sub\s*-?\s*strand/gi, "Sub-Strand")
      .trim()
      .slice(0, 120);
  }

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    // Split-across-two-lines form: "Strand" (or "Sub - Strand") alone,
    // immediately followed by "3. GEOMETRY AROUND US".
    if (loneLabelPattern.test(line) && next && numberedNamePattern.test(next)) {
      flush();
      const label = /sub/i.test(line) ? "Sub-Strand" : "Strand";
      currentHeading = cleanHeading(`${label} ${next}`);
      debugLines.push(`### HEADING ### ${line} / ${next}`);
      i++; // consume the next line too, it's part of this heading
      continue;
    }

    // Same-line form: "Strand 2. ALGEBRAIC REASONING".
    if (inlineHeadingPattern.test(line)) {
      flush();
      currentHeading = cleanHeading(line);
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
