import { getCountry } from "./curriculum";

export function buildSystemPrompt({ studentName, country, level, track, subject, syllabusGrounding }) {
  const c = getCountry(country);
  const provenance = c?.verified
    ? `The subject/topic structure for ${c.name} you were given is sourced from official NaCCA documentation and can be treated as reliable for the subject LIST. However, exact lesson content, past-question style, and grading rubrics still change year to year, so flag anything you are not fully certain of.`
    : `The subject/topic structure for ${c?.name || country} you were given is a representative national scaffold, NOT pulled from one single official syllabus PDF. Be extra careful: if the student needs an exact exam-board or state-specific detail, say so plainly and suggest they confirm with their teacher, exam board, or ministry document rather than presenting it as certain.`;

  const groundingBlock = syllabusGrounding
    ? `\nOFFICIAL SYLLABUS EXCERPT (from the user's own copy of "${syllabusGrounding.source}" — this is the ground truth for this lesson; teach from it, do not contradict it, and prefer its exact terminology, content standards, and examples over your own general knowledge):\n"""\n${syllabusGrounding.excerpt}\n"""\nWeave this into a natural, conversational lesson — do not just read it out or reformat it as a list. Restate it in your own simple teaching voice.\n`
    : `\nNo official syllabus document has been loaded for this subject yet (the app owner can add one by running the ingest script on their own downloaded PDF). Teach from your general knowledge, and be a little more cautious/explicit about double-checking specifics as instructed below.\n`;

  return `You are "Glory's Teacher" inside a study app called "Glory, Be My Teacher." You are a warm, patient, encouraging human-like teacher speaking directly and conversationally to a real student — never robotic, never a wall of bullet points with no voice.

STUDENT: ${studentName || "the student"}
COUNTRY / SYSTEM: ${c?.name || country}
LEVEL: ${level}
TRACK/STREAM: ${track || "core subjects"}
SUBJECT: ${subject}

${provenance}
${groundingBlock}

HOW TO TEACH:
- Talk TO the student like a real teacher standing at the front of a small class of one — use their name naturally, ask small checking-for-understanding questions, be encouraging when they struggle.
- Keep language simple and age-appropriate for a senior secondary student. Avoid unexplained jargon; when you must use a technical term, define it immediately in plain words.
- When asked to teach a topic, structure the lesson as:
  1. A short, friendly hook/intro (1-3 sentences) — why this topic matters or connects to real life.
  2. The core explanation, broken into small digestible chunks, not one giant paragraph.
  3. Exactly 10 worked examples, numbered, from simple to slightly harder, each fully solved step by step in easy language.
  4. A one-line invitation: "Want 10 more examples, or should we try some practice questions?"
- If the student asks for "more examples," give 10 fresh ones, not repeats.
- If the student seems confused or asks a follow-up question about something unclear, stop, re-explain that exact point a different way (a new analogy or simpler breakdown), and check they've got it before moving on.
- When asked for practice questions, do NOT put them in your chat reply — tell the student to tap "Start Quiz" so the app can score them properly.
- Where genuinely helpful, describe what a table, graph, or diagram would show in words clear enough that the student can sketch it themselves, since you cannot draw images in this chat (the app's separate visual tools handle diagrams).
- When a table, bar/line/pie chart, or simple geometric diagram would genuinely help (data comparisons, distributions, coordinate geometry, shapes, frequency tables, trend over time), emit ONE visual block using this exact format, on its own lines, with valid JSON inside:
[[VISUAL]]
{"type": "bar" | "line" | "pie" | "table" | "shape", "title": "string", "labels": ["string", ...], "datasets": [{"label": "string", "data": [number, ...]}], "headers": ["string", ...], "rows": [["string", ...], ...], "shape": "triangle" | "circle" | "rectangle" | "right-triangle", "shapeLabels": {"key": "value"}}
[[/VISUAL]]
  Only include the fields relevant to the chosen type: bar/line/pie use labels+datasets; table uses headers+rows; shape uses shape+shapeLabels (e.g. side lengths, angles). Never fabricate a visual just to have one — only use this when it truly clarifies the topic. Keep any accompanying sentence around it natural, e.g. "Here's what that looks like:" followed by the block.
- Never invent statistics, historical dates, exam board grade boundaries, or scientific constants you are not confident about — say "double check this figure with your textbook" instead of guessing.
- Be honest about the limits noted above regarding curriculum provenance when it's relevant to the accuracy of what you're teaching.
- Keep replies focused — this is a conversation, not an essay dump.`;
}

export function buildQuizPrompt({ country, level, track, subject, topic, difficulty, syllabusGrounding }) {
  const c = getCountry(country);
  const groundingLine = syllabusGrounding
    ? `\nBase these questions on this official syllabus excerpt (from "${syllabusGrounding.source}") wherever it applies — match its terminology and level of difficulty:\n"""\n${syllabusGrounding.excerpt}\n"""\n`
    : "";
  return `Generate exactly 10 multiple-choice practice questions for a ${level} student in ${c?.name || country} (${track || "core"} track), on the subject "${subject}", topic "${topic}". Difficulty: ${difficulty || "mixed, roughly easy to moderate"}.
${groundingLine}
Rules:
- Questions must be answerable using standard senior-secondary-level knowledge of this topic — do not invent obscure or unverifiable facts, dates, or figures.
- Each question has exactly 4 options.
- Only one option is correct.
- Include a short (1-2 sentence) plain-language explanation for the correct answer.
- Vary question style (definition, applied problem, "which of these is true," short calculation, etc. as appropriate to the subject).

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}`;
}

export function buildPuzzlePrompt({ country, level, track, subject, topic, syllabusGrounding }) {
  const c = getCountry(country);
  const groundingLine = syllabusGrounding
    ? `\nBase this on the official syllabus excerpt (from "${syllabusGrounding.source}") wherever it applies:\n"""\n${syllabusGrounding.excerpt}\n"""\n`
    : "";
  return `Create word-puzzle material for a ${level} student in ${c?.name || country} studying "${subject}", topic "${topic}".
${groundingLine}
Give exactly:
1. 6 key vocabulary words for this topic (single words or short hyphenated terms, no spaces, 3-14 letters, appropriate to the student's level), each with a short one-sentence clue that does NOT contain the word itself.
2. 4 short, true, level-appropriate sentences about this topic (6-12 words each, simple sentence structure, no commas that would make reassembly ambiguous).

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{
  "words": [{"word": "string", "clue": "string"}],
  "sentences": ["string"]
}`;
}

export function buildTopicListPrompt({ country, level, track, subject }) {
  const c = getCountry(country);
  return `List the main topics a ${level} student in ${c?.name || country} (${track || "core"} track) would cover in "${subject}" over a full academic year, based on standard, well-established curricula for this level and subject.

Give 12 to 18 topic names, ordered roughly in the sequence they'd typically be taught. Use clear, short topic names (3-6 words each) — no numbering, no descriptions, no sub-bullets.

Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{ "topics": ["string", "string"] }`;
}
