import { getYearPages } from "../../../../lib/pastQuestions";
import { getCallerProfile } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

// Gated when NEXT_PUBLIC_REQUIRE_APPROVAL is on — reading the actual
// content of a past paper is a real feature, not just browsing which years
// exist, so it follows the same rule as lessons/quizzes/puzzles.

export async function POST(req) {
  if (process.env.NEXT_PUBLIC_REQUIRE_APPROVAL === "true") {
    const caller = await getCallerProfile(req);
    if (!caller) {
      return Response.json({ error: "Please sign in first to view past papers." }, { status: 401 });
    }
    if (caller.status !== "approved") {
      return Response.json(
        { error: "Your account is awaiting admin approval before past papers unlock." },
        { status: 403 }
      );
    }
  }

  const { country, subject, year } = await req.json();
  const result = getYearPages(country, subject, year);
  if (!result) {
    return Response.json({ error: "That year isn't available." }, { status: 404 });
  }
  return Response.json(result);
}
