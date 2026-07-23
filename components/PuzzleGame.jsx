"use client";

import { useEffect, useMemo, useState } from "react";

function shuffleTiles(items) {
  const arr = items.map((value, i) => ({ id: `${i}-${value}-${Math.random()}`, value, used: false }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Guard against an already-solved shuffle (rare, but re-shuffle once if so).
  if (arr.map((t) => t.value).join("") === items.join("") && items.length > 2) {
    return shuffleTiles(items);
  }
  return arr;
}

function TileRow({ tiles, answerIds, onTapAvailable, onTapAnswer }) {
  return (
    <>
      <div className="puzzle-answer-row">
        {answerIds.length === 0 && <span className="puzzle-placeholder">Tap tiles below to build your answer…</span>}
        {answerIds.map((id) => {
          const tile = tiles.find((t) => t.id === id);
          return (
            <button key={id} className="puzzle-tile puzzle-tile-answer" onClick={() => onTapAnswer(id)}>
              {tile.value}
            </button>
          );
        })}
      </div>
      <div className="puzzle-tile-row">
        {tiles
          .filter((t) => !answerIds.includes(t.id))
          .map((t) => (
            <button key={t.id} className="puzzle-tile" onClick={() => onTapAvailable(t.id)}>
              {t.value}
            </button>
          ))}
      </div>
    </>
  );
}

// Both puzzle types share the same shape: work through a batch of items,
// and when you've reached the end, silently fetch a fresh batch (never
// repeating what's already been shown) and keep going — no manual click
// needed, and never switching tabs on its own.

function LetterPuzzle({ words, onNeedMore }) {
  const [index, setIndex] = useState(0);
  const [answerIds, setAnswerIds] = useState([]);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [score, setScore] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);

  const word = words[index];
  const tiles = useMemo(() => shuffleTiles(word.word.toUpperCase().split("")), [index, word]);

  function tapAvailable(id) {
    if (feedback) return;
    setAnswerIds((a) => [...a, id]);
  }
  function tapAnswer(id) {
    if (feedback) return;
    setAnswerIds((a) => a.filter((x) => x !== id));
  }

  function check() {
    const built = answerIds.map((id) => tiles.find((t) => t.id === id).value).join("");
    const correct = built === word.word.toUpperCase();
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
  }

  async function next() {
    setFeedback(null);
    setAnswerIds([]);
    if (index + 1 < words.length) {
      setIndex(index + 1);
      return;
    }
    // Reached the end of this batch — fetch fresh words rather than
    // looping back to repeat the same six.
    setFetchingMore(true);
    await onNeedMore();
    setIndex(0);
    setFetchingMore(false);
  }

  if (fetchingMore) {
    return <div className="quiz-progress">Getting you a fresh word…</div>;
  }

  return (
    <div>
      <div className="quiz-progress">Word {index + 1} of {words.length} · Score: {score}</div>
      <div className="puzzle-clue">Clue: {word.clue}</div>
      <TileRow tiles={tiles} answerIds={answerIds} onTapAvailable={tapAvailable} onTapAnswer={tapAnswer} />

      {!feedback && (
        <button className="primary-btn" onClick={check} disabled={answerIds.length !== tiles.length}>
          Check answer
        </button>
      )}
      {feedback && (
        <>
          <div className={`feedback ${feedback}`}>
            {feedback === "correct" ? "Correct! ✔" : `Wrong ✘ — it was "${word.word.toUpperCase()}"`}
          </div>
          <button className="primary-btn" onClick={next}>
            Next word
          </button>
        </>
      )}
    </div>
  );
}

function SentencePuzzle({ sentences, onNeedMore }) {
  const [index, setIndex] = useState(0);
  const [answerIds, setAnswerIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);

  const sentence = sentences[index];
  const words = useMemo(() => sentence.replace(/[.?!]$/, "").split(/\s+/), [index, sentence]);
  const tiles = useMemo(() => shuffleTiles(words), [index, sentence]);

  function tapAvailable(id) {
    if (feedback) return;
    setAnswerIds((a) => [...a, id]);
  }
  function tapAnswer(id) {
    if (feedback) return;
    setAnswerIds((a) => a.filter((x) => x !== id));
  }

  function check() {
    const built = answerIds.map((id) => tiles.find((t) => t.id === id).value).join(" ");
    const correct = built.toLowerCase() === words.join(" ").toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
  }

  async function next() {
    setFeedback(null);
    setAnswerIds([]);
    if (index + 1 < sentences.length) {
      setIndex(index + 1);
      return;
    }
    setFetchingMore(true);
    await onNeedMore();
    setIndex(0);
    setFetchingMore(false);
  }

  if (fetchingMore) {
    return <div className="quiz-progress">Getting you a fresh sentence…</div>;
  }

  return (
    <div>
      <div className="quiz-progress">Sentence {index + 1} of {sentences.length} · Score: {score}</div>
      <TileRow tiles={tiles} answerIds={answerIds} onTapAvailable={tapAvailable} onTapAnswer={tapAnswer} />

      {!feedback && (
        <button className="primary-btn" onClick={check} disabled={answerIds.length !== tiles.length}>
          Check sentence
        </button>
      )}
      {feedback && (
        <>
          <div className={`feedback ${feedback}`}>
            {feedback === "correct" ? "Correct! ✔" : `Wrong ✘ — it was "${sentence}"`}
          </div>
          <button className="primary-btn" onClick={next}>
            Next sentence
          </button>
        </>
      )}
    </div>
  );
}

export default function PuzzleGame({ data, onNeedMoreWords, onNeedMoreSentences }) {
  const [tab, setTab] = useState("letters");

  return (
    <div className="quiz-card">
      <div className="puzzle-tabs">
        <button className={`chip ${tab === "letters" ? "chip-active" : ""}`} onClick={() => setTab("letters")}>
          🔤 Letter Puzzle
        </button>
        <button className={`chip ${tab === "sentences" ? "chip-active" : ""}`} onClick={() => setTab("sentences")}>
          📝 Sentence Builder
        </button>
      </div>

      {tab === "letters" && <LetterPuzzle words={data.words} onNeedMore={onNeedMoreWords} />}
      {tab === "sentences" && <SentencePuzzle sentences={data.sentences} onNeedMore={onNeedMoreSentences} />}

      <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.85rem", marginTop: 16 }}>
        Keep answering — a fresh one loads automatically. Switch tabs anytime; it only changes when you tap the other one.
      </p>
    </div>
  );
}
