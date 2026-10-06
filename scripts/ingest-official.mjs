#!/usr/bin/env node
// Download and index official Ghana SHS curriculum PDFs listed in the manifest.
// Run this in an environment with internet access. The app never invents a
// curriculum URL: every URL must be explicitly recorded in the manifest.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'official-curriculum-manifest.json'), 'utf8'));
const downloadDir = path.join(root, 'downloads', manifest.country + '-official');
fs.mkdirSync(downloadDir, { recursive: true });

const pending = manifest.documents.filter((d) => d.sourceUrl && d.status === 'verified-online');
if (!pending.length) {
  console.error('No verified-online documents are ready in the manifest.');
  process.exit(1);
}

for (const doc of pending) {
  const pdfPath = path.join(downloadDir, `${doc.slug}.pdf`);
  console.log(`Downloading ${doc.subject}...`);
  const result = spawnSync('curl', ['-L', '--fail', '--silent', '--show-error', '-o', pdfPath, doc.sourceUrl], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`Failed to download ${doc.subject}. You can download it manually from: ${doc.sourceUrl}`);
    continue;
  }
  const ingest = spawnSync(process.execPath, [path.join(root, 'scripts', 'ingest.mjs'), pdfPath, manifest.country, doc.subject, doc.sourceUrl, 'current-NaCCA'], { stdio: 'inherit' });
  if (ingest.status !== 0) console.error(`Ingestion failed for ${doc.subject}.`);
}
