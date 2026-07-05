"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthGate({ onReady }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setInfo("Account created! If email confirmation is on, check your inbox, then sign in below.");
    setMode("signin");
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) setError(err.message);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="primary-btn" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        {error && <p className="dictionary-error">{error}</p>}
        {info && <p className="leaderboard-note">{info}</p>}
        <button
          className="chip"
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
        Signed in as <strong>{profile?.name || session.user.email}</strong> — status:{" "}
        <strong>{profile?.status || "loading…"}</strong>{" "}
        <button className="chip" onClick={handleSignOut}>
          Sign out
        </button>
      </p>
      {profile?.status === "pending" && (
        <p className="leaderboard-note" style={{ color: "var(--chalk-yellow)" }}>
          Your account is awaiting admin approval. You can browse subjects below, but
          lessons, quizzes, and puzzles unlock once you're approved.
        </p>
      )}
      {profile?.status === "rejected" && (
        <p className="dictionary-error">This account's access request wasn't approved.</p>
      )}
    </div>
  );
}
