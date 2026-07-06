import { listAvailableYears } from "../../../../lib/pastQuestions";

export const runtime = "nodejs";

// Deliberately NOT gated — seeing WHICH years exist is just browsing,
// same principle as the syllabus topic list.

export async function POST(req) {
  const { country, subject } = await req.json();
  const years = listAvailableYears(country, subject);
  return Response.json({ years });
}
