"use client";

import { useEffect, useState } from "react";
import { supabase, dbEnabled } from "../lib/supabaseClient";
import { getSavedStudentId, saveStudentId } from "../lib/studentClient";

export default function StudentPicker({ onSelect }) {
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbEnabled) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("students").select("id, name").order("name");
    const list = data || [];
    setStudents(list);
    const saved = getSavedStudentId();
    const match = list.find((s) => s.id === saved);
    if (match) {
      setSelectedId(match.id);
      onSelect(match);
    }
    setLoading(false);
  }

  async function addStudent(e) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const { data, error } = await supabase.from("students").insert({ name }).select().single();
    if (error) return;
    setStudents((s) => [...s, data].sort((a, b) => a.name.localeCompare(b.name)));
    select(data);
    setNewName("");
  }

  function select(student) {
    setSelectedId(student.id);
    saveStudentId(student.id);
    onSelect(student);
  }

  if (!dbEnabled) return null;

  return (
    <div>
      <div className="step-label">Who's studying? (so your progress is tracked)</div>
      {loading ? (
        <p className="dictionary-error" style={{ color: "rgba(251,247,236,0.7)" }}>
          Loading students…
        </p>
      ) : (
        <div className="grid">
          {students.map((s) => (
            <button
              key={s.id}
              className={`card-btn ${selectedId === s.id ? "selected" : ""}`}
              onClick={() => select(s)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={addStudent} className="dictionary-form" style={{ marginTop: 4, marginBottom: 24 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a new student's name…"
        />
        <button className="primary-btn" type="submit" disabled={!newName.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}
