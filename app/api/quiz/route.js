import { buildQuizPrompt } from "../../../lib/prompt";
import { retrieveSyllabusExcerpt } from "../../../lib/retrieval";

// Node runtime (not edge) so we can read the locally-ingested syllabus index files.
export const runtime = "nodejs";

export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing GROQ_API_KEY. Add it in Vercel env vars and redeploy." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { country, level, track, subject, topic, difficulty } = body;

  const syllabusGrounding = retrieveSyllabusExcerpt({ country, subject, topic });
  const prompt = buildQuizPrompt({ country, level, track, subject, topic, difficulty, syllabusGrounding });

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.6,
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
    return Response.json({ error: "Could not parse quiz JSON from model output." }, { status: 502 });
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    return Response.json({ error: "Malformed quiz shape returned by model." }, { status: 502 });
  }

  return Response.json(parsed);
}
