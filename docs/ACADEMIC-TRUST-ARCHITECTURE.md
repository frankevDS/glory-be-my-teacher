# Learn With Glory — Academic Trust Architecture

## Product principle

Learn With Glory should behave as a curriculum-aware teacher, not a generic chatbot.
The AI is the teaching layer; authoritative curriculum data is the academic source of truth.

## Trust hierarchy

1. Official government/curriculum authority document.
2. Official examination-board syllabus/specification where applicable.
3. Verified school/exam-board past question with provenance.
4. Structured curriculum metadata extracted from those sources.
5. AI explanation generated from the verified material.
6. AI-generated practice questions, clearly labelled as original practice.

The AI must never present level-5 material as level-1/2/3 authoritative material.

## Student context

Every lesson should carry:

- country
- education system
- curriculum authority
- exam board/standard where applicable
- level/class/grade
- track/stream
- subject
- topic/subtopic
- learning objective/indicator
- source document/version

## Strict curriculum mode

Set `CURRICULUM_TRUST_MODE=strict` in Vercel only after the relevant official syllabus index exists.
In strict mode, tutor and generated-question endpoints refuse to teach from an unverified/missing syllabus rather than silently falling back to generic AI knowledge.

During migration, the default remains `migration` so the current app can continue operating while official sources are ingested.

## Question trust

Authentic past questions and AI-generated practice questions are separate product types.
AI-generated questions must never be labelled as authentic past questions.
Generated MCQs are validated for exact count, four options, a valid answer index, and a non-empty explanation before being returned.

## Mathematics

Prompts are not a sufficient mathematical verification mechanism. A future math-verification service should calculate/verify expressions independently before the AI explains the result.

## Science diagrams

AI image generation must not be treated as the authority for scientific labels. Curriculum-critical diagrams should be generated from structured, verified diagram specifications and rendered deterministically (preferably SVG/HTML), with AI illustration used only as supplementary visual material.

## Retrieval roadmap

Current retrieval is local keyword scoring over ingested PDF chunks. The next production upgrade is structured curriculum records plus semantic/vector retrieval in Supabase (pgvector), while retaining source-document provenance.

## Mastery roadmap

Quiz results should become concept-level mastery rather than only raw percentages. Each question should map to one or more curriculum objectives, enabling remediation and spaced review by weak objective.
