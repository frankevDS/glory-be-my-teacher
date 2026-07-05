import { listSyllabusTopics } from "../../../lib/retrieval";
import { buildTopicListPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";

// Deliberately NOT gated behind admin approval — browsing/previewing the
// syllabus topic list is exactly the "look around before you're approved"
// behavior the app is meant to allow. Only actual lessons/quizzes/puzzles
// are gated.

export async function POST(req) {
  const body = await req.json();
  const { country, level, track, subject } = body;

  // Prefer real, official topics from a PDF you've ingested (see
  // scripts/ingest.mjs) over anything AI-generated.
  const local = listSyllabusTopics(country, subject);
  if (local) {
    return Response.json({ topics: local.topics, source: "syllabus", sourceDoc: local.source });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server is missing GROQ_API_KEY." }, { status: 500 });
  }

  const prompt = buildTopicListPrompt({ country, level, track, subject });

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You output only valid JSON matching the exact schema requested. No prose, no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!groqRes.ok) {
    const errText = await groqRes.text().catch(() => "");
    return Response.json({ error: `Groq request failed: ${groqRes.status} ${errText}` }, { status: 502 });
  }

  const data = await groqRes.json();
  const raw = data.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Could not parse topic list from model output." }, { status: 502 });
  }

  if (!Array.isArray(parsed.topics)) {
    return Response.json({ error: "Malformed topic list returned by model." }, { status: 502 });
  }

  return Response.json({ topics: parsed.topics, source: "ai-suggested" });
}
