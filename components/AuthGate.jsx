"use client";

import { useEffect, useState } from "react";
import { supabase, dbEnabled } from "../lib/supabaseClient";
import { getPlanLabel } from "../lib/planStatus";

export default function AuthGate({ onReady }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dbEnabled) {
      onReady(null);
      return;
    }
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) loadProfile(newSession.user.id);
      else {
        setProfile(null);
        onReady(null);
      }
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session) await loadProfile(data.session.user.id);
    else onReady(null);
  }

  async function loadProfile(userId) {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
    onReady(data);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      setBusy(false);
      if (err) {
        setError(String(err.message || "Something went wrong. Please try again."));
        return;
      }
      // Supabase quirk: signing up with an email that's already registered
      // often returns NO error and NO new identity — it just silently does
      // nothing, to avoid leaking which emails are registered. Catch that
      // case explicitly so it doesn't look like a mystery freeze.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError("That email is already registered — try signing in instead, below.");
        setMode("signin");
        return;
      }
      setInfo("Account created! If email confirmation is on, check your inbox, then sign in below.");
      setMode("signin");
    } catch (e) {
      setBusy(false);
      console.error("Sign up failed:", e);
      setError("Something went wrong signing up. Please check your connection and try again.");
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (err) setError(String(err.message || "Something went wrong. Please try again."));
    } catch (e) {
      setBusy(false);
      console.error("Sign in failed:", e);
      setError("Something went wrong signing in. Please check your connection and try again.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!dbEnabled) {
    return (
      <div className="auth-gate">
        <p className="dictionary-error">
          Admin approval is turned on, but the base Supabase connection isn't configured yet.
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in Vercel's Environment Variables (the same ones used for the leaderboard/dashboard),
          then redeploy.
        </p>
      </div>
    );
  }

  if (session === undefined) {
    return <p style={{ color: "rgba(251,247,236,0.7)" }}>Loading account…</p>;
  }

  if (!session) {
    return (
      <div className="auth-gate">
        <div className="step-label">{mode === "signin" ? "Sign in" : "Create an account"}</div>
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="auth-form">
          {mode === "signup" && (
            <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((s) => !s)}
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <button className="primary-btn" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {error && <p className="dictionary-error">{error}</p>}
        {info && <p className="leaderboard-note">{info}</p>}
        <button
          className="chip chip-inverse"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setInfo("");
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    );
  }

  return (
    <div className="auth-gate">
      <p style={{ color: "rgba(251,247,236,0.85)" }}>
        Signed in as <strong>{profile?.name || session.user.email}</strong>{" "}
        <button className="chip chip-inverse" onClick={handleSignOut}>
          Sign out
        </button>
      </p>
      <p style={{ color: "var(--chalk-yellow)", fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}>
        {getPlanLabel(profile)}
      </p>
      {profile?.status === "rejected" && (
        <p className="dictionary-error">This account's access request wasn't approved.</p>
      )}
      <a href="/pricing" style={{ color: "var(--paper)", textDecoration: "underline", fontSize: "0.9rem" }}>
        💳 View Pricing / Upgrade
      </a>
    </div>
  );
}
