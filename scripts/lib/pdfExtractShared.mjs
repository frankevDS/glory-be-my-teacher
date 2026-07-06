// scripts/lib/pdfExtractShared.mjs
//
// Shared PDF-to-text extraction, used by both scripts/ingest.mjs (syllabus)
// and scripts/ingest-past-questions.mjs. Uses pdfjs-dist directly rather
// than pdf-parse, which we found to be unreliable on some PDFs.

import fs from "node:fs";

// Returns an array of page texts (one string per page), reconstructing
// line breaks from each glyph's vertical position, since pdf.js gives us
// positioned text runs, not paragraphs.
export async function extractPages(filePath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    const lines = new Map(); // roundedY -> [{x, str}]
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push({ x, str: item.str });
    }
    const orderedYs = [...lines.keys()].sort((a, b) => b - a);
    let pageText = "";
    for (const y of orderedYs) {
      const parts = lines.get(y).sort((a, b) => a.x - b.x);
      pageText += parts.map((p) => p.str).join(" ") + "\n";
    }
    pages.push(pageText);
  }
  return pages;
}

export async function extractText(filePath) {
  const pages = await extractPages(filePath);
  return pages.join("\n\n");
}
