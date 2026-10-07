#!/usr/bin/env node
// Build-time official curriculum ingestion.
// Vercel runs `prebuild` before `next build`, so the deployed bundle contains
// the verified curriculum index. Only URLs explicitly recorded in the manifest
// are eligible. By default Mathematics is built first; set
// CURRICULUM_BUILD_SUBJECTS=all (or a comma-separated list) to expand coverage.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'official-curriculum-manifest.json'), 'utf8'));
const downloadDir = path.join(root, 'downloads', manifest.country + '-official');
fs.mkdirSync(downloadDir, { recursive: true });

const requested = (process.env.CURRICULUM_BUILD_SUBJECTS || 'Mathematics')
  .split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const all = requested.includes('all');
const docs = manifest.documents.filter((d) =>
  d.sourceUrl && d.status === 'verified-online' && (all || requested.includes(d.subject.toLowerCase()))
);

if (!docs.length) {
  console.log('No official curriculum documents selected for build-time ingestion.');
  process.exit(0);
}

async function download(url, target) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 10000) throw new Error(`Downloaded file is unexpectedly small (${buffer.length} bytes)`);
  fs.writeFileSync(target, buffer);
}

for (const doc of docs) {
  const pdfPath = path.join(downloadDir, `${doc.slug}.pdf`);
  try {
    console.log(`Official curriculum build: ${doc.subject}`);
    await download(doc.sourceUrl, pdfPath);
    const ingest = spawnSync(process.execPath, [
      path.join(root, 'scripts', 'ingest.mjs'), pdfPath, manifest.country,
      doc.subject, doc.sourceUrl, 'current-NaCCA'
    ], { stdio: 'inherit' });
    if (ingest.status !== 0) throw new Error(`ingest exited with ${ingest.status}`);
  } catch (err) {
    console.warn(`Official curriculum ingestion skipped for ${doc.subject}: ${err.message}`);
    console.warn(`Source: ${doc.sourceUrl}`);
    // Do not make the whole deployment fail because one official source is
    // temporarily unavailable. Strict mode will correctly keep that subject
    // disabled if no verified local index was produced.
  }
}
