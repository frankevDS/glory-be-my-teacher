"use client";

export default function SpeakButton({ text, small }) {
  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // stop any previous utterance first
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  if (!text || !text.trim()) return null;

  return (
    <button
      type="button"
      onClick={speak}
      title="Read aloud"
      aria-label="Read aloud"
      className={small ? "speak-btn-small" : "speak-btn"}
    >
      🔊
    </button>
  );
}
