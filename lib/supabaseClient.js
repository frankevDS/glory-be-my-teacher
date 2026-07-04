"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If the leaderboard hasn't been set up yet, this stays null and the
// leaderboard UI quietly hides itself instead of crashing the app.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const leaderboardEnabled = Boolean(supabase);
