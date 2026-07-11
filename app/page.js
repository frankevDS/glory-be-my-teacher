"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { getAccessToken } from "../../lib/authClient";
import Footer from "../../components/Footer";
import PricingManager from "../../components/PricingManager";

const DURATIONS = [
  { label: "No expiry", months: 0 },
  { label: "1 month", months: 1 },
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
];

function monthsFromNow(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return "Never";
  const date = new Date(expiresAt);
  const isPast = date < new Date();
  const formatted = date.toLocaleDateString();
  return isPast ? `Expired ${formatted}` : formatted;
}

export default function AdminPage() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [durations, setDurations] = useState({}); // profileId -> months selected
  const [tab, setTab] = useState("users"); // "users" | "pricing"

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

  function approve(p) {
    const months = durations[p.id] ?? 0;
    const updates = { status: "approved" };
    if (months > 0) updates.expiresAt = monthsFromNow(months);
    else updates.clearExpiry = true;
    updateProfile(p.id, updates);
  }

  function extend(p) {
    const months = durations[p.id] ?? 0;
    if (months === 0) {
      updateProfile(p.id, { clearExpiry: true });
    } else {
      updateProfile(p.id, { expiresAt: monthsFromNow(months) });
    }
  }

  const backHome = (
    <a
      href="/"
      style={{ color: "var(--paper)", fontFamily: "var(--font-display)", display: "inline-block", marginBottom: 16 }}
    >
      ← Back home
    </a>
  );

  if (loading) {
    return (
      <main className="wrap">
        {backHome}
        <p>Loading…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="wrap">
        {backHome}
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
        {backHome}
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
      {backHome}

      <section className="hero">
        <span className="chalk-tag">Admin ✎</span>
        <h1>Admin</h1>
        <p>Approve accounts, or manage pricing plans — switch tabs below.</p>
      </section>

      <div className="puzzle-tabs">
        <button className={`chip ${tab === "users" ? "chip-active" : ""}`} onClick={() => setTab("users")}>
          👤 Users
        </button>
        <button className={`chip ${tab === "pricing" ? "chip-active" : ""}`} onClick={() => setTab("pricing")}>
          💳 Pricing
        </button>
      </div>

      {error && <p className="dictionary-error">{error}</p>}

      {tab === "pricing" && <PricingManager />}

      {tab === "users" && (
        <>
          <p style={{ color: "rgba(251,247,236,0.75)" }}>
            Pick how long an approval should last before approving — leave "No expiry" for unlimited access.
          </p>
          <div style={{ textAlign: "right", maxWidth: 900, margin: "0 auto 10px" }}>
            <button className="chip" onClick={loadProfiles}>
              🔄 Refresh list
            </button>
          </div>
          <div className="visual-block" style={{ maxWidth: 900, margin: "0 auto", overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Role</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name} {p.isSuperAdmin && <span title="Protected super admin">🛡️</span>}
                </td>
                <td>{p.email}</td>
                <td>{p.status}</td>
                <td>{formatExpiry(p.expires_at)}</td>
                <td>{p.role}</td>
                <td>
                  {!p.isSuperAdmin && (
                    <select
                      value={durations[p.id] ?? 0}
                      onChange={(e) => setDurations((d) => ({ ...d, [p.id]: Number(e.target.value) }))}
                      style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid var(--paper-line)" }}
                    >
                      {DURATIONS.map((d) => (
                        <option key={d.months} value={d.months}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.isSuperAdmin ? (
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Protected account</span>
                  ) : (
                    <>
                      {p.status !== "approved" && (
                        <button className="chip" onClick={() => approve(p)}>
                          Approve
                        </button>
                      )}
                      {p.status === "approved" && (
                        <button className="chip" onClick={() => extend(p)}>
                          Update expiry
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
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && <p>No accounts yet.</p>}
          </div>
        </>
      )}

      <Footer />
    </main>
  );
}
