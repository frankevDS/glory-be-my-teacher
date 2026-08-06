"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, listSubjectsFor } from "../lib/curriculum";
import { dbEnabled, supabase } from "../lib/supabaseClient";
import StudentPicker from "../components/StudentPicker";
import AuthGate from "../components/AuthGate";
import Footer from "../components/Footer";
import { saveStudentId } from "../lib/studentClient";

const requireApproval = process.env.NEXT_PUBLIC_REQUIRE_APPROVAL === "true";

export default function Home() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("Glory");
  const [studentId, setStudentId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [country, setCountry] = useState("ghana");
  const [level, setLevel] = useState(COUNTRIES.ghana.levels[0]);
  const [track, setTrack] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState("");
  const [topicList, setTopicList] = useState([]);
  const [topicListSource, setTopicListSource] = useState(null); // "syllabus" | "ai-suggested"

  useEffect(() => {
    if (!dbEnabled || !studentId) return;
    const beat = () => {
      supabase
        .from("students")
        .update({ last_seen: new Date().toISOString() })
        .eq("id", studentId)
        .then(({ error }) => {
          if (error) console.error("Presence heartbeat failed:", error);
        });
    };
    beat();
    const interval = setInterval(beat, 45000);
    return () => clearInterval(interval);
  }, [studentId]);
  const [topicListLoading, setTopicListLoading] = useState(false);
  const [searchTopic, setSearchTopic] = useState("");

  const countryData = COUNTRIES[country];
  const trackNames = Object.keys(countryData.tracks);
  const subjects = useMemo(() => listSubjectsFor(country, track), [country, track]);

  useEffect(() => {
    if (!subject) {
      setTopicList([]);
      setTopicListSource(null);
      return;
    }
    let cancelled = false;
    setTopicListLoading(true);
    setTopicList([]);
    fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, level, track, subject }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setTopicList(data.topics || []);
        setTopicListSource(data.source || null);
      })
      .catch(() => {
        if (!cancelled) setTopicListSource(null);
      })
      .finally(() => {
        if (!cancelled) setTopicListLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, level, track, subject]);

  function pickCountry(key) {
    setCountry(key);
    setLevel(COUNTRIES[key].levels[0]);
    setTrack(null);
    setSubject(null);
    setTopic("");
    setSearchTopic("");
  }

  function start() {
    if (!subject || !topic.trim()) return;
    if (requireApproval && !profile) return;
    const params = new URLSearchParams({
      name: studentName || "Student",
      studentId: studentId || "",
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
        <h1>Learn With Glory</h1>
        <p className="hero-subtitle">The app that began as "Glory, Be My Teacher" — a gift for one student, now for every student.</p>
        <p>
          A study companion for senior high school — Ghana, Nigeria, the UK, and the USA.
          Pick your country, your track, your subject, and tell your teacher what you want
          to learn today.
        </p>
        <div className="top-links">
          <a href="/past-questions">📝 Past Questions</a>
          {dbEnabled && (
            <>
              <span className="footer-dot">·</span>
              <a href="/review">🔁 Review due questions</a>
              <span className="footer-dot">·</span>
              <a href="/dashboard">📊 Parent / Teacher Dashboard</a>
              {requireApproval && profile?.role === "admin" && (
                <>
                  <span className="footer-dot">·</span>
                  <a href="/admin">🔐 Admin</a>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {requireApproval ? (
        <AuthGate
          onReady={(p) => {
            setProfile(p);
            if (p) {
              setStudentId(p.id);
              setStudentName(p.name);
              saveStudentId(p.id);
            }
          }}
        />
      ) : dbEnabled ? (
        <StudentPicker
          onSelect={(s) => {
            setStudentId(s.id);
            setStudentName(s.name);
          }}
        />
      ) : (
        <>
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
        </>
      )}

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
                  setTopic("");
                  setSearchTopic("");
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
            onClick={() => {
              setSubject(s);
              setTopic("");
              setSearchTopic("");
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="step-label">5. Topic for today — tap one from the syllabus</div>
      {!subject && (
        <p style={{ color: "rgba(251,247,236,0.6)" }}>Pick a subject above first.</p>
      )}
      {subject && topicListLoading && (
        <p style={{ color: "rgba(251,247,236,0.7)" }}>Loading topics…</p>
      )}
      {subject && !topicListLoading && topicList.length > 0 && (
        <>
          <div className="provenance">
            {topicListSource === "syllabus"
              ? "✔ From your ingested official syllabus document"
              : "⚠ AI-suggested topic list — double-check against your textbook or syllabus"}
          </div>
          <div className="grid">
            {topicList.map((t) => (
              <button
                key={t}
                className={`card-btn ${topic === t ? "selected" : ""}`}
                onClick={() => {
                  setTopic(t);
                  setSearchTopic("");
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
      {subject && !topicListLoading && topicList.length === 0 && (
        <p style={{ color: "rgba(251,247,236,0.7)" }}>
          Couldn't load a topic list right now — use search below instead.
        </p>
      )}

      <div className="step-label">6. Or search for a specific topic</div>
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <input
          value={searchTopic}
          onChange={(e) => {
            setSearchTopic(e.target.value);
            setTopic(e.target.value);
          }}
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

      {topic && (
        <p style={{ color: "var(--chalk-yellow)", fontFamily: "var(--font-chalk)", fontSize: "1.05rem" }}>
          Today's topic: {topic}
        </p>
      )}

      <button
        className="primary-btn"
        onClick={start}
        disabled={!subject || !topic.trim() || (requireApproval && !profile)}
      >
        Start today's lesson →
      </button>

      <Footer />
    </main>
  );
}
