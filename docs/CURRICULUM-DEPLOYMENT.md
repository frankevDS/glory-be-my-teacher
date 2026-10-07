# Curriculum deployment

The app uses strict curriculum trust in production. A subject can teach only when
its local `syllabus-index/ghana-<subject>.json` was generated from an approved
official NaCCA source.

## Vercel

The official curriculum ingestion runs in **two ways** so it is not dependent on
Vercel's default Next.js build command:

1. `postinstall` runs `scripts/ingest-official.mjs` after dependencies are installed.
2. `vercel.json` explicitly sets the build command to `npm run build`, whose
   `prebuild` hook runs the ingestion again when the project is built through npm.

By default the build ingests Mathematics from the official NaCCA PDF.

To expand the build:

`CURRICULUM_BUILD_SUBJECTS=Mathematics,Biology,Physics`

or:

`CURRICULUM_BUILD_SUBJECTS=all`

Only documents explicitly listed in `scripts/official-curriculum-manifest.json`
with an approved official source URL are eligible.

If an official source is temporarily unavailable, the build continues but strict
mode keeps that subject disabled. The app never substitutes AI-generated syllabus
content for a missing official curriculum.
