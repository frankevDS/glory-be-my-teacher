"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getAccessToken } from "../../lib/authClient";
import Footer from "../../components/Footer";

export default function AdminPage() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (!data.session) {
      setLoading(false);
      return;
    }
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
    setProfile(prof);
    if (prof?.role === "admin") await loadProfiles();
    setLoading(false);
  }

  async function loadProfiles() {
    const token = await getAccessToken();
    const res = await fetch("/api/admin/list-profiles", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    setProfiles(data.profiles);
  }

  async function updateProfile(targetUserId, updates) {
    const token = await getAccessToken();
    const res = await fetch("/api/admin/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId, ...updates }),
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    loadProfiles();
  }

  if (loading) {
    return (
      <main className="wrap">
        <p>Loading…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="wrap">
        <section className="hero">
          <h1>🔐 Admin</h1>
          <p>Sign in from the home page first, then come back here.</p>
        </section>
        <Footer />
      </main>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <main className="wrap">
        <section className="hero">
          <h1>🔐 Admin</h1>
          <p>Your account doesn't have admin access.</p>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="wrap">
      <a
        href="/"
        style={{ color: "var(--paper)", fontFamily: "var(--font-display)", display: "inline-block", marginBottom: 16 }}
      >
        ← Back home
      </a>

      <section className="hero">
        <span className="chalk-tag">Admin ✎</span>
        <h1>Approve Users</h1>
        <p>Approve, reject, or promote accounts requesting access.</p>
      </section>

      {error && <p className="dictionary-error">{error}</p>}

      <div className="visual-block" style={{ maxWidth: 760, margin: "0 auto", overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.status}</td>
                <td>{p.role}</td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.status !== "approved" && (
                    <button className="chip" onClick={() => updateProfile(p.id, { status: "approved" })}>
                      Approve
                    </button>
                  )}
                  {p.status !== "rejected" && (
                    <button className="chip" onClick={() => updateProfile(p.id, { status: "rejected" })}>
                      Reject
                    </button>
                  )}
                  {p.role !== "admin" && (
                    <button className="chip" onClick={() => updateProfile(p.id, { role: "admin" })}>
                      Make Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && <p>No accounts yet.</p>}
      </div>

      <Footer />
    </main>
  );
}
