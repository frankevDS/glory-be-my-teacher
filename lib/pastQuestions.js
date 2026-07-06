import fs from "node:fs";
import path from "node:path";

const INDEX_DIR = path.join(process.cwd(), "past-questions-index");

function slugify(s) {
  return (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Returns [{ year, source, pageCount }] for whatever years have been
// ingested for this country+subject (fuzzy-matched, same as syllabus
// retrieval, so "Core Mathematics" finds files ingested as "mathematics").
export function listAvailableYears(country, subject) {
  if (!fs.existsSync(INDEX_DIR)) return [];
  const countrySlug = slugify(country);
  const subjectSlug = slugify(subject);

  const files = fs.readdirSync(INDEX_DIR).filter((f) => f.startsWith(`${countrySlug}-`) && f.endsWith(".json"));
  const matches = [];
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, f), "utf-8"));
      const fileSubjectSlug = slugify(data.subject);
      if (subjectSlug.includes(fileSubjectSlug) || fileSubjectSlug.includes(subjectSlug)) {
        matches.push({ year: data.year, source: data.source, pageCount: data.pageCount });
      }
    } catch {
      continue;
    }
  }
  return matches.sort((a, b) => b.year.localeCompare(a.year));
}

// Returns { pages, source } for a specific ingested year, or null.
export function getYearPages(country, subject, year) {
  if (!fs.existsSync(INDEX_DIR)) return null;
  const countrySlug = slugify(country);
  const subjectSlug = slugify(subject);

  const files = fs.readdirSync(INDEX_DIR).filter((f) => f.startsWith(`${countrySlug}-`) && f.endsWith(".json"));
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, f), "utf-8"));
      const fileSubjectSlug = slugify(data.subject);
      const subjectMatches = subjectSlug.includes(fileSubjectSlug) || fileSubjectSlug.includes(subjectSlug);
      if (subjectMatches && String(data.year) === String(year)) {
        return { pages: data.pages, source: data.source };
      }
    } catch {
      continue;
    }
  }
  return null;
}
