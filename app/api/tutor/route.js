import { buildSystemPrompt } from "../../../lib/prompt";
import { retrieveSyllabusExcerpt } from "../../../lib/retrieval";

// Node runtime (not edge) so we can read the locally-ingested syllabus index files.
export const runtime = "nodejs";

export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      "Server is missing GROQ_API_KEY. Add it in your Vercel project's Environment Variables, then redeploy.",
      { status: 500 }
    );
  }

  const body = await req.json();
  const { studentName, country, level, track, subject, topic, messages } = body;

  const syllabusGrounding = retrieveSyllabusExcerpt({ country, subject, topic });
  const systemPrompt = buildSystemPrompt({ studentName, country, level, track, subject, syllabusGrounding });

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      stream: true,
      temperature: 0.5,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!groqRes.ok || !groqRes.body) {
    const errText = await groqRes.text().catch(() => "");
    return new Response(`Groq request failed: ${groqRes.status} ${errText}`, {
      status: 502,
    });
  }

  // Re-stream, extracting just the text deltas so the client can render plain text.
  const reader = groqRes.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // ignore malformed chunk
          }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
