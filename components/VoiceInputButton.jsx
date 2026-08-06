"use client";

import { useEffect, useRef, useState } from "react";

// Uses the browser's free, built-in speech-to-text (Web Speech API) — no
// external service, no API key, no cost. Support varies by browser: works
// well in Chrome/Edge/Safari, is unreliable or absent in Firefox — the
// button simply hides itself when the browser doesn't support it, rather
// than showing something broken.
export default function VoiceInputButton({ onTranscript }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    setSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`voice-btn ${listening ? "voice-btn-active" : ""}`}
      title={listening ? "Listening… tap to stop" : "Tap and speak your question"}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
    >
      {listening ? "🔴" : "🎤"}
    </button>
  );
}
