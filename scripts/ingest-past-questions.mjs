#!/usr/bin/env node
// scripts/ingest-past-questions.mjs
//
// Turns YOUR OWN legally-obtained copy of a past exam paper (or past-questions
// compilation) into a local, browsable index, tagged by year.
//
// Usage:
//   npm run ingest-pq -- ./downloads/ghana-math-2023.pdf ghana mathematics 2023
//
// COPYRIGHT: past exam papers are copyrighted by the exam body (WAEC, NECO,
// an exam board, a ministry, etc.). This script does not download or supply
// any past papers itself — you provide your own legally-obtained copy. The
// resulting index is extracted text from YOUR file, meant for your own
// household/school's study use. If you turn on NEXT_PUBLIC_REQUIRE_APPROVAL
// (see the admin-approval README section), access to this content can be
// gated to approved users only, rather than left open to the public internet
// — worth doing if you load in real copyrighted papers.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPages } from "./lib/pdfExtractShared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [, , pdfPath, country, subject, year] = process.argv;

if (!pdfPath || !country || !subject || !year) {
  console.error("Usage: npm run ingest-pq -- <path-to-pdf> <country-key> <subject-slug> <year>");
  console.error("Example: npm run ingest-pq -- ./downloads/math-2023.pdf ghana mathematics 2023");
  process.exit(1);
}

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const pages = await extractPages(pdfPath);

  const outDir = path.join(__dirname, "..", "past-questions-index");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slugify(country)}-${slugify(subject)}-${year}.json`);

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        country,
        subject,
        year: String(year),
        source: path.basename(pdfPath),
        ingestedAt: new Date().toISOString(),
        pageCount: pages.length,
        pages,
      },
      null,
      2
    )
  );

  console.log(`Indexed ${pages.length} pages from "${pdfPath}" -> ${outPath}`);
  console.log("Redeploy (or restart `next dev`) for the past-questions portal to pick this up.");
}

main().catch((err) => {
  console.error("Ingestion failed:", err.message);
  process.exit(1);
});
