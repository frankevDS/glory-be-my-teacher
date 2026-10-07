# Curriculum deployment

The app uses strict curriculum trust in production. A subject can teach only when
its local `syllabus-index/ghana-<subject>.json` was generated from an approved
official NaCCA source.

## Vercel

`npm run build` automatically runs `prebuild`, which runs
`scripts/ingest-official.mjs`.

By default, the build ingests **Mathematics** from the official NaCCA PDF so the
first Ghana subject is immediately usable after deployment.

To expand the build:

`CURRICULUM_BUILD_SUBJECTS=Mathematics,Biology,Physics`

or:

`CURRICULUM_BUILD_SUBJECTS=all`

Only documents explicitly listed in `scripts/official-curriculum-manifest.json`
with an approved official source URL are eligible.

If a source is temporarily unavailable, the build continues but strict mode keeps
that subject disabled. This is safer than silently teaching from AI-generated
content.
