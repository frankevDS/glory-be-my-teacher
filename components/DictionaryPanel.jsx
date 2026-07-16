"use client";

import { useState } from "react";
import SpeakButton from "./SpeakButton";
import { supabase } from "../lib/supabaseClient";

export default function DictionaryPanel({ onClose, country, level, subject }) {
  const [word, setWord] = useState("");
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [contextInfo, setContextInfo] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState("");

  async function lookup(e) {
    e.preventDefault();
    const w = word.trim();
    if (!w) return;
    setLoading(true);
    setError("");
    setEntry(null);
    setContextInfo(null);
    setContextError("");
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
      if (!res.ok) {
        setError(`No general dictionary entry found for "${w}". Check the spelling, or try the subject-specific explanation below.`);
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

  async function explainInSubject() {
    const w = word.trim();
    if (!w || !subject) return;
    setContextLoading(true);
    setContextError("");
    setContextInfo(null);
    try {
      const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : null;
      const res = await fetch("/api/word-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ word: w, country, level, subject }),
      });
      const data = await res.json();
      if (data.error) {
        setContextError(data.error);
        return;
      }
      setContextInfo(data);
    } catch {
      setContextError("Couldn't reach the AI teacher right now.");
    }
    setContextLoading(false);
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
                  <li key={j}>
                    {def.definition}
                    {def.example && <div className="dictionary-example">e.g. "{def.example}"</div>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {subject && word.trim() && (
        <div className="dictionary-context">
          <button className="chip" onClick={explainInSubject} disabled={contextLoading}>
            {contextLoading ? "Asking your teacher…" : `🔬 What does this mean in ${subject}?`}
          </button>
          {contextError && <p className="dictionary-error">{contextError}</p>}
          {contextInfo && (
            <div className="dictionary-context-result">
              <p>{contextInfo.explanation}</p>
              {contextInfo.example && <div className="dictionary-example">e.g. "{contextInfo.example}"</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
