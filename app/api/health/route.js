import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function countVerifiedIndexes() {
  const dir = path.join(process.cwd(), "syllabus-index");
  if (!fs.existsSync(dir)) return { total: 0, verified: 0, subjects: [] };
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  let verified = 0;
  const subjects = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      if (data?.verified === true) {
        verified += 1;
        subjects.push({ country: data.country || null, subject: data.subject || file.replace(/\.json$/, ""), curriculumVersion: data.curriculumVersion || null });
      }
    } catch {}
  }
  return { total: files.length, verified, subjects };
}

export async function GET() {
  const indexes = countVerifiedIndexes();
  const configured = (process.env.CURRICULUM_TRUST_MODE || "").trim().toLowerCase();
  const strict = configured === "strict" || (configured !== "migration" && process.env.NODE_ENV === "production");

  return Response.json({
    ok: true,
    app: "learn-with-glory",
    environment: process.env.NODE_ENV || "unknown",
    curriculumTrustMode: strict ? "strict" : "migration",
    aiConfigured: Boolean(process.env.GROQ_API_KEY),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    approvalGateEnabled: process.env.NEXT_PUBLIC_REQUIRE_APPROVAL === "true",
    curriculumIndexes: indexes,
  }, { headers: { "Cache-Control": "no-store" } });
}
