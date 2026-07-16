"use client";

import { useEffect, useMemo, useState } from "react";
import { COUNTRIES, listSubjectsFor } from "../../lib/curriculum";
import { supabase } from "../../lib/supabaseClient";
import Footer from "../../components/Footer";

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];

export default function PastQuestionsPage() {
  const [country, setCountry] = useState("ghana");
  const [level, setLevel] = useState(COUNTRIES.ghana.levels[0]);
  const [track, setTrack] = useState(null);
  const [subject, setSubject] = useState(null);
  const [topic, setTopic] = useState("");

  const [availableYears, setAvailableYears] = useState([]); // real ingested years
  const [selectedYear, setSelectedYear] = useState(null);
  const [pages, setPages] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSource, setPageSource] = useState("");
  const [viewError, setViewError] = useState("");

  const [quiz, setQuiz] = useState(null);
  const [quizIsLookalike, setQuizIsLookalike] = useState(false);
  const [quizYearLabel, setQuizYearLabel] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  const countryData = COUNTRIES[country];
  const trackNames = Object.keys(countryData.tracks);
  const subjects = useMemo(() => listSubjectsFor(country, track), [country, track]);

  useEffect(() => {
    setPages(null);
    setSelectedYear(null);
    setQuiz(null);
    if (!subject) {
      setAvailableYears([]);
      return;
    }
    fetch("/api/past-questions/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, subject }),
    })
      .then((res) => res.json())
      .then((data) => setAvailableYears(data.years || []))
      .catch(() => setAvailableYears([]));
  }, [country, subject]);

  async function authHeader() {
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function viewYear(year) {
    setSelectedYear(year);
    setQuiz(null);
    setPages(null);
    setViewError("");
    setPageIndex(0);
    const res = await fetch("/api/past-questions/view", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ country, subject, year }),
    });
    const data = await res.json();
    if (data.error) {
      setViewError(data.error);
      return;
    }
    setPages(data.pages);
    setPageSource(data.source);
  }

  async function generateForYear(year) {
    setSelectedYear(year);
    setPages(null);
    setViewError("");
    setGenLoading(true);
    setGenError("");
    setScore(0);
    setQuizIndex(0);
    setSelectedOption(null);
    setQuiz(null);
    const res = await fetch("/api/past-questions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ country, level, track, subject, topic: "" }),
    });
    const data = await res.json();
    setGenLoading(false);
    if (data.error) {
      setGenError(data.error);
      return;
    }
    setQuiz(data.questions);
    setQuizIsLookalike(true);
    setQuizYearLabel(year);
  }

  async function generatePractice() {
    setGenLoading(true);
    setGenError("");
    setSelectedYear(null);
    setPages(null);
    setScore(0);
    setQuizIndex(0);
    setSelectedOption(null);
    const res = await fetch("/api/past-questions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ country, level, track, subject, topic }),
    });
    const data = await res.json();
    setGenLoading(false);
    if (data.error) {
      setGenError(data.error);
      return;
    }
    setQuiz(data.questions);
    setQuizIsLookalike(false);
    setQuizYearLabel(null);
  }

  function answer(idx) {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === quiz[quizIndex].correctIndex) setScore((s) => s + 1);
  }
  function next() {
    setSelectedOption(null);
    setQuizIndex((i) => i + 1);
  }
  const quizDone = quiz && quizIndex >= quiz.length;

  return (
    <main className="wrap">
      <a href="/" style={{ color: "var(--paper)", fontFamily: "var(--font-display)", display: "inline-block", marginBottom: 16 }}>
        ← Back home
      </a>

      <section className="hero">
        <span className="chalk-tag">Practice like exam day ✎</span>
        <h1>Past Questions</h1>
        <p>
          Browse real past papers you've loaded in (2020–2026), or generate fresh
          AI exam-style practice questions instantly for any subject.
        </p>
      </section>

      <div className="step-label">1. Country / system</div>
      <div className="grid">
        {Object.entries(COUNTRIES).map(([key, c]) => (
          <button
            key={key}
            className={`card-btn ${country === key ? "selected" : ""}`}
            onClick={() => {
              setCountry(key);
              setLevel(COUNTRIES[key].levels[0]);
              setTrack(null);
              setSubject(null);
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="step-label">2. Level / year group</div>
      <div className="grid">
        {countryData.levels.map((l) => (
          <button key={l} className={`card-btn ${level === l ? "selected" : ""}`} onClick={() => setLevel(l)}>
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
          <button key={s} className={`card-btn ${subject === s ? "selected" : ""}`} onClick={() => setSubject(s)}>
            {s}
          </button>
        ))}
      </div>

      {subject && (
        <>
          <div className="step-label">5. Past questions (2020–2026)</div>
          <p style={{ color: "rgba(251,247,236,0.65)", fontSize: "0.9rem", marginTop: -6, marginBottom: 12 }}>
            Years marked ✔ are real papers loaded in. Others generate a fresh, clearly-labeled AI practice
            set styled like a typical exam — not a reproduction of that year's actual questions.
          </p>
          <div className="grid">
            {YEARS.map((y) => {
              const real = availableYears.find((a) => a.year === y);
              return (
                <button
                  key={y}
                  className={`card-btn ${selectedYear === y ? "selected" : ""}`}
                  onClick={() => (real ? viewYear(y) : generateForYear(y))}
                >
                  {y}
                  <span className="sub">{real ? "✔ real paper" : "AI practice set"}</span>
                </button>
              );
            })}
          </div>

          {genLoading && <p>Preparing your practice set…</p>}

          {viewError && <p className="dictionary-error">{viewError}</p>}

          {pages && (
            <div className="visual-block" style={{ maxWidth: 700, margin: "0 auto 24px" }}>
              <div className="visual-title">
                {subject} — {selectedYear} · page {pageIndex + 1} of {pages.length}
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Source: your own uploaded document ({pageSource})</p>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: "0.95rem" }}>
                {pages[pageIndex]}
              </pre>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  className="chip"
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                >
                  ← Previous page
                </button>
                <button
                  className="chip"
                  onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
                  disabled={pageIndex === pages.length - 1}
                >
                  Next page →
                </button>
              </div>
            </div>
          )}

          <div className="step-label">Or: generate AI exam-style practice (any year, instantly)</div>
          <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='Optional: focus on one topic, e.g. "Algebraic Expressions" — leave blank for a mixed set'
              style={{ padding: "14px 16px", borderRadius: 10, border: "none", fontFamily: "var(--font-body)", fontSize: "1rem" }}
            />
          </div>
          <button className="primary-btn" onClick={generatePractice} disabled={genLoading} style={{ marginBottom: 20 }}>
            {genLoading ? "Generating…" : "Generate 10 exam-style questions"}
          </button>
          {genError && <p className="dictionary-error">{genError}</p>}

          {quiz && (
            <div className="quiz-card" style={{ maxWidth: 640, margin: "0 auto" }}>
              {quizIsLookalike && (
                <div className="provenance" style={{ background: "rgba(181,72,47,0.12)", color: "var(--clay)", marginBottom: 16 }}>
                  ⚠ AI-generated practice questions styled like a typical {quizYearLabel} exam paper — NOT a
                  reproduction of that year's actual questions. Organized under {quizYearLabel} for convenience only.
                </div>
              )}
              {!quizDone && (
                <>
                  <div className="quiz-progress">
                    Question {quizIndex + 1} of {quiz.length} · Score: {score}
                  </div>
                  <div className="quiz-question">{quiz[quizIndex].question}</div>
                  {quiz[quizIndex].options.map((opt, idx) => {
                    let cls = "quiz-option";
                    if (selectedOption !== null) {
                      if (idx === quiz[quizIndex].correctIndex) cls += " correct";
                      else if (idx === selectedOption) cls += " wrong";
                    }
                    return (
                      <button key={idx} className={cls} onClick={() => answer(idx)}>
                        {opt}
                      </button>
                    );
                  })}
                  {selectedOption !== null && (
                    <>
                      <div className={`feedback ${selectedOption === quiz[quizIndex].correctIndex ? "correct" : "wrong"}`}>
                        {selectedOption === quiz[quizIndex].correctIndex ? "Correct! ✔" : "Wrong ✘"}
                      </div>
                      <p>{quiz[quizIndex].explanation}</p>
                      <button className="primary-btn" onClick={next}>
                        {quizIndex + 1 === quiz.length ? "See my score" : "Next question"}
                      </button>
                    </>
                  )}
                </>
              )}
              {quizDone && (
                <div className="score-banner">
                  You scored {score} / {quiz.length}! 🎉
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Footer />
    </main>
  );
}
