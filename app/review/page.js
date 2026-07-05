"use client";

import { useEffect, useState } from "react";
import { supabase, dbEnabled } from "../../lib/supabaseClient";
import { getSavedStudentId } from "../../lib/studentClient";
import { nextSchedule } from "../../lib/spacedRepetition";
import Footer from "../../components/Footer";

export default function ReviewPage() {
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [masteredCount, setMasteredCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    if (!dbEnabled) {
      setError("Review needs the free Supabase setup — see the README's leaderboard section.");
      setLoading(false);
      return;
    }
    const studentId = getSavedStudentId();
    if (!studentId) {
      setError("Pick a student profile on the home page first, then come back here.");
      setLoading(false);
      return;
    }

    const { data: student } = await supabase.from("students").select("name").eq("id", studentId).single();
    setStudentName(student?.name || "");

    const { data, error: err } = await supabase
      .from("quiz_mistakes")
      .select("*")
      .eq("student_id", studentId)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(10);

    if (err) {
      setError("Couldn't load your review questions right now.");
      setLoading(false);
      return;
    }
    setItems(data || []);
    setLoading(false);
  }

  async function answer(idx) {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const item = items[index];
    const wasCorrect = idx === item.correct_index;
    const { nextReviewAt, reviewedCount, mastered } = nextSchedule(item.reviewed_count, wasCorrect);

    if (mastered) {
      setMasteredCount((m) => m + 1);
      await supabase.from("quiz_mistakes").delete().eq("id", item.id);
    } else {
      await supabase
        .from("quiz_mistakes")
        .update({ reviewed_count: reviewedCount, next_review_at: nextReviewAt.toISOString() })
        .eq("id", item.id);
    }
  }

  function next() {
    setSelectedOption(null);
    setIndex((i) => i + 1);
  }

  const done = items.length > 0 && index >= items.length;

  return (
    <main className="wrap">
      <a href="/" style={{ color: "var(--paper)", fontFamily: "var(--font-display)", display: "inline-block", marginBottom: 16 }}>
        ← Back home
      </a>

      <section className="hero">
        <span className="chalk-tag">Spaced review ✎</span>
        <h1>🔁 Review</h1>
        <p>Questions {studentName ? `for ${studentName}` : ""} that are due for another look, so they really stick.</p>
      </section>

      <div className="notebook">
        <div className="notebook-header">
          <strong>Review queue</strong>
        </div>

        <div className="quiz-card" style={{ borderRadius: 0 }}>
          {loading && <p>Loading…</p>}

          {!loading && error && <p className="dictionary-error">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p>Nothing due for review right now — nice work! Come back after studying a bit more.</p>
          )}

          {!loading && !error && items.length > 0 && !done && (
            <>
              <div className="quiz-progress">
                Question {index + 1} of {items.length} · {items[index].subject}: {items[index].topic}
              </div>
              <div className="quiz-question">{items[index].question}</div>
              {items[index].options.map((opt, idx) => {
                let cls = "quiz-option";
                if (selectedOption !== null) {
                  if (idx === items[index].correct_index) cls += " correct";
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
                  <div className={`feedback ${selectedOption === items[index].correct_index ? "correct" : "wrong"}`}>
                    {selectedOption === items[index].correct_index ? "Correct! ✔" : "Wrong ✘"}
                  </div>
                  <p>{items[index].explanation}</p>
                  <button className="primary-btn" onClick={next}>
                    {index + 1 === items.length ? "Finish review" : "Next question"}
                  </button>
                </>
              )}
            </>
          )}

          {done && (
            <div className="score-banner">
              Review complete! {masteredCount > 0 && `${masteredCount} question(s) fully mastered. 🎉`}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
