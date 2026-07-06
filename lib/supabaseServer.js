import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a "use client" component, and
// never expose SUPABASE_SERVICE_ROLE_KEY with a NEXT_PUBLIC_ prefix — it
// bypasses Row Level Security entirely, by design, for admin operations.

export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Verifies the bearer token in the request actually belongs to a signed-in
// Supabase user (this is the real security check — a client claiming "I'm
// approved" means nothing without this), then returns their profile row
// (including role/status) via the service client.
// A profile counts as genuinely approved only if status is "approved" AND
// (it has no expiry date, or that date hasn't passed yet). This is the one
// place that logic lives, so every gated route checks it the same way.
export function isApproved(profile) {
  if (!profile || profile.status !== "approved") return false;
  if (!profile.expires_at) return true;
  return new Date(profile.expires_at) > new Date();
}

export async function getCallerProfile(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await anonClient.auth.getUser(token);
  if (userErr || !userData?.user) return null;

  const service = getServiceClient();
  if (!service) return null;
  const { data: profile } = await service.from("profiles").select("*").eq("id", userData.user.id).single();
  return profile || null;
}
