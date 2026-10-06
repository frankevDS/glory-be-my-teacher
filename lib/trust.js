/** Academic trust helpers.
 *
 * Strict mode is opt-in so the existing app keeps working during migration.
 * Set CURRICULUM_TRUST_MODE=strict in Vercel when the authoritative syllabus
 * indexes for a country/subject are ready.
 */
export function isStrictCurriculumMode() {
  const configured = (process.env.CURRICULUM_TRUST_MODE || "").trim().toLowerCase();
  if (configured === "strict") return true;
  if (configured === "migration") return false;
  return process.env.NODE_ENV === "production";
}

export function requireVerifiedGrounding({ grounding, country, subject }) {
  if (grounding?.verified) return null;
  if (!isStrictCurriculumMode()) return null;
  return `This subject is not yet backed by a verified curriculum source for ${country}/${subject}. Teaching is disabled in strict curriculum mode until the official syllabus is ingested and verified.`;
}

export function validateGeneratedQuestions(questions, expectedCount = 10) {
  if (!Array.isArray(questions) || questions.length !== expectedCount) {
    return { ok: false, error: `Expected exactly ${expectedCount} questions.` };
  }

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    if (!q || typeof q.question !== "string" || !q.question.trim()) {
      return { ok: false, error: `Question ${i + 1} has no question text.` };
    }
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((x) => typeof x !== "string" || !x.trim())) {
      return { ok: false, error: `Question ${i + 1} must have exactly four non-empty options.` };
    }
    if (new Set(q.options.map((x) => x.trim().toLowerCase())).size !== 4) {
      return { ok: false, error: `Question ${i + 1} must have four distinct options.` };
    }
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
      return { ok: false, error: `Question ${i + 1} has an invalid answer key.` };
    }
    if (typeof q.explanation !== "string" || !q.explanation.trim()) {
      return { ok: false, error: `Question ${i + 1} has no explanation.` };
    }
  }
  return { ok: true };
}
