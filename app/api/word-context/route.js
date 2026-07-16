import { buildWordContextPrompt } from "../../../lib/prompt";
import { getCallerProfile, isApproved } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server is missing GROQ_API_KEY." }, { status: 500 });
  }

  if (process.env.NEXT_PUBLIC_REQUIRE_APPROVAL === "true") {
    const caller = await getCallerProfile(req);
    if (!caller) {
      return Response.json({ error: "Please sign in first to use this." }, { status: 401 });
    }
    if (!isApproved(caller)) {
      return Response.json(
        { error: "Your account is not currently approved (either still pending, or your access period has ended)." },
        { status: 403 }
      );
    }
  }

  const { word, country, level, subject } = await req.json();
  if (!word || !subject) {
    return Response.json({ error: "Missing word or subject." }, { status: 400 });
  }

  const prompt = buildWordContextPrompt({ word, country, level, subject });

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
    return Response.json({ error: "Could not parse response." }, { status: 502 });
  }

  return Response.json(parsed);
}
