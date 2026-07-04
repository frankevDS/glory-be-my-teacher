"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, listSubjectsFor } from "../lib/curriculum";

export default function Home() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("Glory");
  const [country, setCountry] = useState("ghana");
  const [level, setLevel] = useState(COUNTRIES.ghana.levels[0]);
  const [track, setTrack] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState("");

  const countryData = COUNTRIES[country];
  const trackNames = Object.keys(countryData.tracks);
  const subjects = useMemo(() => listSubjectsFor(country, track), [country, track]);

  function pickCountry(key) {
    setCountry(key);
    setLevel(COUNTRIES[key].levels[0]);
    setTrack(null);
    setSubject(null);
  }

  function start() {
    if (!subject || !topic.trim()) return;
    const params = new URLSearchParams({
      name: studentName || "Student",
      country,
      level,
      track: track || "",
      subject,
      topic: topic.trim(),
    });
    router.push(`/learn?${params.toString()}`);
  }

  return (
    <main className="wrap">
      <section className="hero">
        <span className="chalk-tag">Welcome back to class ✎</span>
        <h1>Glory, Be My Teacher</h1>
        <p>
          A study companion for senior high school — Ghana, Nigeria, the UK, and the USA.
          Pick your country, your track, your subject, and tell your teacher what you want
          to learn today.
        </p>
      </section>

      <div className="step-label">Your name</div>
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="What should your teacher call you?"
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
          }}
        />
      </div>

      <div className="step-label">1. Country / system</div>
      <div className="grid">
        {Object.entries(COUNTRIES).map(([key, c]) => (
          <button
            key={key}
            className={`card-btn ${country === key ? "selected" : ""}`}
            onClick={() => pickCountry(key)}
          >
            {c.name}
            <span className="sub">{c.levelLabel}</span>
          </button>
        ))}
      </div>

      <div className="provenance">
        {countryData.verified ? "✔ " : "⚠ "}
        {countryData.source}
      </div>

      <div className="step-label">2. Level / year</div>
      <div className="grid">
        {countryData.levels.map((l) => (
          <button
            key={l}
            className={`card-btn ${level === l ? "selected" : ""}`}
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {trackNames.length > 0 && (
        <>
          <div className="step-label">3. Track / stream</div>
          <div className="grid">
            {trackNames.map((t) => (
              <button
                key={t}
                className={`card-btn ${track === t ? "selected" : ""}`}
                onClick={() => {
                  setTrack(t);
                  setSubject(null);
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="step-label">4. Subject</div>
      <div className="grid">
        {subjects.map((s) => (
          <button
            key={s}
            className={`card-btn ${subject === s ? "selected" : ""}`}
            onClick={() => setSubject(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="step-label">5. Topic for today</div>
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g. "Algebraic Expressions", "The Cell", "Trigonometric Ratios"'
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: "1rem",
          }}
        />
      </div>

      <button className="primary-btn" onClick={start} disabled={!subject || !topic.trim()}>
        Start today's lesson →
      </button>
    </main>
  );
}
