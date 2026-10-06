# Ghana authoritative curriculum implementation

## Source of truth

For Ghana, the app must distinguish the national curriculum authority from AI-generated suggestions.
The primary curriculum authority is the **National Council for Curriculum and Assessment (NaCCA)**.
NaCCA publishes the Secondary Education Curriculum and subject curriculum documents. The official
NaCCA curriculum page is `https://nacca.gov.gh/secondary-education-curriculum/`.

The West African Examinations Council (WAEC Ghana) is treated separately as an examination authority.
Its WASSCE/BECE materials can support examination alignment and authentic past-question provenance, but
WAEC is not substituted for NaCCA as the curriculum authority.

## Verification rule

A syllabus index is `verified: true` only when:

1. the PDF was supplied to the ingestion script;
2. an official source URL was recorded at ingestion time; and
3. the source URL belongs to an approved Ghana curriculum-authority domain.

This prevents the country-level `verified` flag from accidentally making every subject trustworthy.

## Ingestion

```bash
npm run ingest -- ./downloads/mathematics.pdf ghana mathematics https://nacca.gov.gh/<official-document> 2025
```

The generated `syllabus-index/ghana-mathematics.json` records authority, source URL, curriculum version,
verification status and extracted chunks.

## Important limitation

The application does **not** invent a complete Ghana syllabus when an official subject document is absent.
In migration mode, the UI may still expose AI-suggested topics for development. In strict curriculum-trust
mode, lesson/quiz generation must refuse to teach until verified grounding exists for the selected subject.

## Examination layer

Authentic past questions must retain their original provenance (exam, year, paper, subject and source).
AI-generated exam-style questions must always be labelled as AI-generated and must never be presented as
real past questions.

## Subject catalog

`data/curriculum/ghana-shs-catalog.json` records the subject names currently exposed by NaCCA's official
Secondary Education Curriculum page. It is intentionally a **catalog**, not a fabricated list of topics.
The app should use the catalog to constrain subject selection, then use the individual official subject
curriculum index as the source of teaching content.
