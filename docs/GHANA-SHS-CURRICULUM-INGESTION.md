# Ghana SHS Curriculum Intelligence

## Authority hierarchy

1. Government of Ghana / Ministry of Education curriculum resource hub.
2. National Council for Curriculum and Assessment (NaCCA) official Secondary Education Curriculum documents.
3. WAEC Ghana for examination specifications and verified past questions.
4. Structured local indexes generated only from those official documents.
5. AI-generated teaching and practice content grounded in the indexed material.

## Current official resource hubs

- NaCCA Secondary Education Curriculum: https://nacca.gov.gh/secondary-education-curriculum/
- Ministry of Education curriculum resource hub: https://curriculumresources.edu.gh/
- NaCCA subject-combination guidelines: https://nacca.gov.gh/subject-combination-guidelines-secondary-education/

## What the importer records

Each indexed subject records:

- country
- subject
- curriculum authority
- original official source URL
- curriculum version
- ingestion timestamp
- SHS year coverage
- detected Strand headings
- detected Sub-Strand headings
- extraction-quality status
- searchable curriculum chunks

The importer does not mark a document verified merely because a filename looks official. `verified` is based on the recorded URL belonging to an approved authority domain.

## Important safety rule

Do not turn on `CURRICULUM_TRUST_MODE=strict` until the required subjects for a learner's selected pathway have verified indexes. If the official document is missing, the tutor must not silently substitute general AI knowledge while strict mode is active.

## Official-document coverage currently verified online

The initial verified manifest records Mathematics, General Science, Biology, Physics, Economics, History and Government from NaCCA's official curriculum document repository. Chemistry is catalogued but awaits confirmation of its exact downloadable URL before being marked `verified-online`.

The Ministry's curriculum microsite explicitly separates learner and teacher resources for Year 1, Year 2 and Year 3, and NaCCA's subject documents contain SHS 1–3 scope/sequence material. This is the basis for building the year-aware curriculum tree rather than generating a topic list with AI.
