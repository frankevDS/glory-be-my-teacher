"use client";

import { useState } from "react";
import SpeakButton from "./SpeakButton";

export default function DictionaryPanel({ onClose }) {
  const [word, setWord] = useState("");
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e) {
    e.preventDefault();
    const w = word.trim();
    if (!w) return;
    setLoading(true);
    setError("");
    setEntry(null);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      if (!res.ok) {
        setError(`No dictionary entry found for "${w}". Check the spelling and try again.`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEntry(data[0]);
    } catch {
      setError("Couldn't reach the dictionary right now — check your internet connection.");
    }
    setLoading(false);
  }

  return (
    <div className="dictionary-panel">
      <div className="dictionary-header">
        <strong>Dictionary</strong>
        <button className="chip" onClick={onClose}>
          Close
        </button>
      </div>
      <form onSubmit={lookup} className="dictionary-form">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Type a word to check its meaning or spelling…"
        />
        <button className="primary-btn" type="submit" disabled={loading || !word.trim()}>
          {loading ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && <p className="dictionary-error">{error}</p>}

      {entry && (
        <div className="dictionary-entry">
          <div className="dictionary-word-row">
            <span className="dictionary-word">{entry.word}</span>
            {entry.phonetic && <span className="dictionary-phonetic">{entry.phonetic}</span>}
            <SpeakButton text={entry.word} small />
          </div>
          {(entry.meanings || []).map((meaning, i) => (
            <div key={i} className="dictionary-meaning">
              <em>{meaning.partOfSpeech}</em>
              <ol>
                {meaning.definitions.slice(0, 3).map((def, j) => (
                  <li key={j}>{def.definition}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
