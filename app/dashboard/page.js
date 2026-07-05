"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { supabase, dbEnabled } from "../../lib/supabaseClient";
import Footer from "../../components/Footer";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function DashboardPage() {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [history, setHistory] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dbEnabled) loadStudents();
  }, []);

  useEffect(() => {
    if (selectedId) loadHistory(selectedId);
  }, [selectedId]);

  async function loadStudents() {
    const { data } = await supabase.from("students").select("id, name").order("name");
    setStudents(data || []);
    if (data && data.length > 0) setSelectedId(data[0].id);
  }

  async function loadHistory(studentId) {
    setLoading(true);
    const { data } = await supabase
      .from("study_history")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(100);
    setHistory(data || []);

    const { count } = await supabase
      .from("quiz_mistakes")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .lte("next_review_at", new Date().toISOString());
    setDueCount(count || 0);
    setLoading(false);
  }

  const quizRows = useMemo(() => history.filter((h) => h.activity_type === "quiz"), [history]);
  const lessonCount = useMemo(() => history.filter((h) => h.activity_type === "lesson").length, [history]);

  const chartData = useMemo(() => {
    const chronological = [...quizRows].reverse();
    return {
      labels: chronological.map((r) => new Date(r.created_at).toLocaleDateString()),
      datasets: [
        {
          label: "Quiz score %",
          data: chronological.map((r) => Math.round((r.score / r.total) * 100)),
          borderColor: "#4C9A6A",
          backgroundColor: "#4C9A6A55",
          tension: 0.25,
        },
      ],
    };
  }, [quizRows]);

  const weakTopics = useMemo(() => {
    const bySubjectTopic = {};
    for (const r of quizRows) {
      const key = `${r.subject} — ${r.topic}`;
      const pct = Math.round((r.score / r.total) * 100);
      if (!bySubjectTopic[key] || new Date(r.created_at) > new Date(bySubjectTopic[key].created_at)) {
        bySubjectTopic[key] = { key, pct, created_at: r.created_at };
      }
    }
    return Object.values(bySubjectTopic)
      .filter((t) => t.pct < 70)
      .sort((a, b) => a.pct - b.pct);
  }, [quizRows]);

  const avgScore = quizRows.length
    ? Math.round(quizRows.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / quizRows.length)
    : null;

  if (!dbEnabled) {
    return (
      <main className="wrap">
        <section className="hero">
          <h1>📊 Dashboard</h1>
          <p>
            The dashboard needs the free Supabase setup described in the README (the same one used for the
            leaderboard and review features). Once that's connected, this page comes alive automatically.
          </p>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="wrap">
      <a href="/" style={{ color: "var(--paper)", fontFamily: "var(--font-display)", display: "inline-block", marginBottom: 16 }}>
        ← Back home
      </a>

      <section className="hero">
        <span className="chalk-tag">For parents & teachers ✎</span>
        <h1>Progress Dashboard</h1>
        <p>See what's been studied, how quizzes are going, and what needs another look.</p>
      </section>

      <div className="step-label">Student</div>
      <div className="grid">
        {students.map((s) => (
          <button
            key={s.id}
            className={`card-btn ${selectedId === s.id ? "selected" : ""}`}
            onClick={() => setSelectedId(s.id)}
          >
            {s.name}
          </button>
        ))}
      </div>
      {students.length === 0 && (
        <p style={{ color: "rgba(251,247,236,0.75)" }}>
          No students yet — start a lesson from the home page and pick/add a name there first.
        </p>
      )}

      {selectedId && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{lessonCount}</div>
              <div className="stat-label">Lessons studied</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{quizRows.length}</div>
              <div className="stat-label">Quizzes taken</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{avgScore !== null ? `${avgScore}%` : "—"}</div>
              <div className="stat-label">Average quiz score</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dueCount}</div>
              <div className="stat-label">Questions due for review</div>
            </div>
          </div>

          {loading && <p>Loading…</p>}

          {!loading && chartData.labels.length > 1 && (
            <div className="visual-block" style={{ maxWidth: 640, margin: "0 auto 24px" }}>
              <div className="visual-title">Quiz score over time</div>
              <Line data={chartData} options={{ responsive: true, scales: { y: { min: 0, max: 100 } } }} />
            </div>
          )}

          {!loading && weakTopics.length > 0 && (
            <div className="visual-block" style={{ maxWidth: 640, margin: "0 auto 24px" }}>
              <div className="visual-title">Topics that may need another look (last score under 70%)</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {weakTopics.map((t) => (
                  <li key={t.key} style={{ marginBottom: 6 }}>
                    {t.key} — <strong>{t.pct}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className="visual-block" style={{ maxWidth: 640, margin: "0 auto 24px", overflowX: "auto" }}>
              <div className="visual-title">Recent activity</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 15).map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleDateString()}</td>
                      <td>{h.activity_type}</td>
                      <td>{h.subject}</td>
                      <td>{h.topic}</td>
                      <td>{h.activity_type === "quiz" ? `${h.score}/${h.total}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && history.length === 0 && (
            <p style={{ color: "rgba(251,247,236,0.75)" }}>No activity logged yet for this student.</p>
          )}
        </>
      )}

      <Footer />
    </main>
  );
}
