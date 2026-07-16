"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import VisualBlock, { splitVisuals } from "../../components/VisualBlock";
import SpeakButton from "../../components/SpeakButton";
import DictionaryPanel from "../../components/DictionaryPanel";
import Leaderboard from "../../components/Leaderboard";
import PuzzleGame from "../../components/PuzzleGame";
import { supabase, dbEnabled } from "../../lib/supabaseClient";

function LearnInner() {
  const params = useSearchParams();
  const router = useRouter();

  const name = params.get("name") || "Student";
  const studentId = params.get("studentId") || null;
  const country = params.get("country") || "ghana";
  const level = params.get("level") || "";
  const track = params.get("track") || "";
  const subject = params.get("subject") || "";
  const topic = params.get("topic") || "";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" | "quiz" | "puzzle"
  const [quiz, setQuiz] = useState(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [puzzleLoading, setPuzzleLoading] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [quizLogged, setQuizLogged] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Kick off the first lesson automatically.
    sendToTutor(`Please teach me about "${topic}" in ${subject}.`, true);
    if (dbEnabled && studentId) {
      supabase.from("study_history").insert({
        student_id: studentId,
        country,
        level,
        track: track || null,
        subject,
        topic,
        activity_type: "lesson",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendToTutor(text, isAuto = false) {
    const nextMessages = isAuto
      ? []
      : [...messages, { role: "user", content: text }];
    if (!isAuto) setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const res = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        studentName: name,
        country,
        level,
        track,
        subject,
        topic,
        messages: [...nextMessages, ...(isAuto ? [{ role: "user", content: text }] : [])],
      }),
    });

    if (!res.body) {
      setStreaming(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: acc };
        return copy;
      });
    }
    setStreaming(false);
  }

  async function startQuiz(difficulty) {
    setQuizLoading(true);
    setMode("quiz");
    setScore(0);
    setQuizIndex(0);
    setSelectedOption(null);
    setWrongAnswers([]);
    setQuizLogged(false);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ country, level, track, subject, topic, difficulty }),
    });
    const data = await res.json();
    setQuizLoading(false);
    if (data.error) {
      alert(data.error);
      setMode("chat");
      return;
    }
    setQuiz(data.questions);
  }

  async function loadPuzzles() {
    setPuzzleLoading(true);
    setMode("puzzle");
    const res = await fetch("/api/puzzle", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ country, level, track, subject, topic }),
    });
    const data = await res.json();
    setPuzzleLoading(false);
    if (data.error) {
      alert(data.error);
      setMode("chat");
      return;
    }
    setPuzzleData(data);
  }

  function answer(idx) {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const q = quiz[quizIndex];
    if (idx === q.correctIndex) {
      setScore((s) => s + 1);
    } else {
      setWrongAnswers((w) => [...w, q]);
    }
  }

  function nextQuestion() {
    setSelectedOption(null);
    setQuizIndex((i) => i + 1);
  }

  const quizDone = quiz && quizIndex >= quiz.length;

  async function authHeader() {
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    if (!quizDone || quizLogged || !dbEnabled || !studentId) return;
    setQuizLogged(true);
    supabase.from("study_history").insert({
      student_id: studentId,
      country,
      level,
      track: track || null,
      subject,
      topic,
      activity_type: "quiz",
      score,
      total: quiz.length,
    });
    if (wrongAnswers.length > 0) {
      supabase.from("quiz_mistakes").insert(
        wrongAnswers.map((q) => ({
          student_id: studentId,
          country,
          subject,
          topic,
          question: q.question,
          options: q.options,
          correct_index: q.correctIndex,
          explanation: q.explanation,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizDone]);

  return (
    <main className="wrap">
      <button
        onClick={() => router.push("/")}
        style={{ background: "none", border: "none", color: "var(--paper)", marginBottom: 16, fontFamily: "var(--font-display)" }}
      >
        ← Change subject
      </button>

      <div className="notebook">
        <div className="notebook-header">
          <div>
            <strong>{subject}</strong> — {topic}
            <div className="path">
              {country.toUpperCase()} · {level} {track && `· ${track}`}
            </div>
          </div>
          {mode === "chat" ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="chip chip-inverse" onClick={() => setShowDictionary((s) => !s)}>
                📖 Dictionary
              </button>
              <button className="chip chip-inverse" onClick={loadPuzzles}>
                🧩 Puzzles
              </button>
              <button className="primary-btn" onClick={() => startQuiz("mixed")}>
                Start Quiz
              </button>
            </div>
          ) : (
            <button className="primary-btn" onClick={() => setMode("chat")}>
              Back to Lesson
            </button>
          )}
        </div>

        {showDictionary && mode === "chat" && (
          <DictionaryPanel
            onClose={() => setShowDictionary(false)}
            country={country}
            level={level}
            subject={subject}
          />
        )}

        {mode === "chat" && (
          <>
            <div className="chat-area">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role === "user" ? "student" : "teacher"}`}>
                  {m.role === "assistant" && (
                    <SpeakButton
                      small
                      text={splitVisuals(m.content)
                        .filter((p) => p.type === "text")
                        .map((p) => p.content)
                        .join(" ")}
                    />
                  )}
                  {m.role === "assistant"
                    ? splitVisuals(m.content).map((part, j) =>
                        part.type === "visual" ? (
                          <VisualBlock key={j} data={part.content} />
                        ) : (
                          <span key={j}>{part.content}</span>
                        )
                      )
                    : m.content}
                </div>
              ))}
              {streaming && <div className="msg teacher">…</div>}
              <div ref={chatEndRef} />
            </div>

            <div className="quick-row">
              <button className="chip" onClick={() => sendToTutor("Can I get 10 more examples, please?")}>
                10 more examples
              </button>
              <button className="chip" onClick={() => sendToTutor("I'm still confused, please explain it a different way.")}>
                I'm confused — explain differently
              </button>
              <button className="chip" onClick={() => startQuiz("mixed")}>
                Test me now
              </button>
            </div>

            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) sendToTutor(input.trim());
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your teacher anything about this topic…"
                disabled={streaming}
              />
              <button className="primary-btn" type="submit" disabled={streaming || !input.trim()}>
                Send
              </button>
            </form>
          </>
        )}

        {mode === "quiz" && (
          <div className="quiz-card">
            {quizLoading && <p>Preparing your 10 questions…</p>}

            {!quizLoading && quiz && !quizDone && (
              <>
                <div className="quiz-progress">
                  Question {quizIndex + 1} of {quiz.length} · Score so far: {score}
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
                    <button className="primary-btn" onClick={nextQuestion}>
                      {quizIndex + 1 === quiz.length ? "See my score" : "Next question"}
                    </button>
                  </>
                )}
              </>
            )}

            {quizDone && (
              <>
                <div className="score-banner">
                  {name}, you scored {score} / {quiz.length}! 🎉
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
                  <button className="primary-btn" onClick={() => startQuiz("mixed")}>
                    Try 10 more questions
                  </button>
                  <button className="chip" onClick={() => setMode("chat")}>
                    Back to lesson
                  </button>
                </div>
                <Leaderboard
                  studentName={name}
                  country={country}
                  level={level}
                  track={track}
                  subject={subject}
                  topic={topic}
                  score={score}
                  total={quiz.length}
                />
              </>
            )}
          </div>
        )}

        {mode === "puzzle" && (
          <>
            {puzzleLoading && <div className="quiz-card">Building your puzzles…</div>}
            {!puzzleLoading && puzzleData && (
              <PuzzleGame data={puzzleData} onMore={loadPuzzles} loadingMore={puzzleLoading} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<main className="wrap">Loading…</main>}>
      <LearnInner />
    </Suspense>
  );
}
