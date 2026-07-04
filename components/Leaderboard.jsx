"use client";

import { useEffect, useState } from "react";
import { supabase, leaderboardEnabled } from "../lib/supabaseClient";

export default function Leaderboard({ studentName, country, level, track, subject, topic, score, total }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (leaderboardEnabled) fetchTop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTop() {
    const { data, error: err } = await supabase
      .from("leaderboard")
      .select("student_name, score, total, created_at")
      .eq("country", country)
      .eq("subject", subject)
      .eq("topic", topic)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);
    if (err) {
      setError("Couldn't load the leaderboard right now.");
      return;
    }
    setRows(data || []);
  }

  async function submitScore() {
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("leaderboard").insert({
      student_name: studentName || "Student",
      country,
      level,
      track: track || null,
      subject,
      topic,
      score,
      total,
    });
    setSubmitting(false);
    if (err) {
      setError("Couldn't submit your score — please try again.");
      return;
    }
    setSubmitted(true);
    fetchTop();
  }

  if (!leaderboardEnabled) return null; // no Supabase env vars set — feature hides itself

  return (
    <div className="leaderboard">
      <div className="leaderboard-title">🏆 Leaderboard — {subject}: {topic}</div>

      {!submitted && (
        <button className="primary-btn" onClick={submitScore} disabled={submitting}>
          {submitting ? "Submitting…" : `Submit my score (${score}/${total})`}
        </button>
      )}
      {submitted && <p className="leaderboard-note">Your score is on the board! 🎉</p>}
      {error && <p className="dictionary-error">{error}</p>}

      {rows.length > 0 && (
        <ol className="leaderboard-list">
          {rows.map((r, i) => (
            <li key={i}>
              <span className="leaderboard-name">{r.student_name}</span>
              <span className="leaderboard-score">{r.score}/{r.total}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
