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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , pdfPath, country, subject] = process.argv;

if (!pdfPath || !country || !subject) {
  console.error("Usage: npm run ingest -- <path-to-pdf> <country-key> <subject-slug>");
  console.error("Example: npm run ingest -- ./downloads/math.pdf ghana mathematics");
  process.exit(1);
}

async function extractText(filePath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // Group text items into lines using their vertical position (transform[5] = y),
    // since pdf.js gives us positioned glyph runs, not paragraphs/lines directly.
    const lines = new Map(); // roundedY -> [{x, str}]
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push({ x, str: item.str });
    }
    const orderedYs = [...lines.keys()].sort((a, b) => b - a); // top of page first
    for (const y of orderedYs) {
      const parts = lines.get(y).sort((a, b) => a.x - b.x);
      text += parts.map((p) => p.str).join(" ") + "\n";
    }
    text += "\n";
  }
  return text;
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
// (Strand/Unit/Chapter/Topic/ALL CAPS short lines) to label each chunk.
function chunkText(rawText) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const headingPattern = /^(strand|sub-strand|unit|chapter|topic|module|theme)\b/i;
  const allCapsShort = (l) => l.length < 70 && l === l.toUpperCase() && /[A-Z]/.test(l);

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
    if (headingPattern.test(line) || allCapsShort(line)) {
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
