"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "../lib/authClient";

const BLANK = { label: "", price_ghs: "", months: "", note: "", highlight: false, active: true, sort_order: 0 };

function perMonth(price_ghs, months) {
  const p = Number(price_ghs);
  const m = Number(months);
  if (!p || !m) return null;
  return (p / m).toFixed(1);
}

export default function PricingManager() {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null); // "new" | plan id | null
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const token = await getAccessToken();
    const res = await fetch("/api/admin/pricing", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setPlans(data.plans || []);
  }

  function startEdit(plan) {
    setEditingId(plan.id);
    setForm({ ...plan });
    setError("");
  }

  function startNew() {
    setEditingId("new");
    setForm({ ...BLANK, sort_order: plans.length + 1 });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(BLANK);
  }

  async function save() {
    if (!form.label || !form.price_ghs || !form.months) {
      setError("Label, price, and months are all required.");
      return;
    }
    const token = await getAccessToken();
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        id: editingId === "new" ? undefined : editingId,
        price_ghs: Number(form.price_ghs),
        months: Number(form.months),
        sort_order: Number(form.sort_order) || 0,
      }),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
      return;
    }
    cancelEdit();
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this plan? This can't be undone.")) return;
    const token = await getAccessToken();
    const res = await fetch("/api/admin/pricing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.error) {
      alert(data.error);
      return;
    }
    load();
  }

  const isEditingForm = editingId !== null;

  return (
    <div>
      {error && <p className="dictionary-error">{error}</p>}
      {loading && <p>Loading plans…</p>}

      {!loading && (
        <div className="visual-block" style={{ maxWidth: 900, margin: "0 auto 20px", overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Price (GHS)</th>
                <th>Months</th>
                <th>Per month</th>
                <th>Note</th>
                <th>Highlight</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>{p.label}</td>
                  <td>{p.price_ghs}</td>
                  <td>{p.months}</td>
                  <td>≈ {perMonth(p.price_ghs, p.months)}/mo</td>
                  <td>{p.note || "—"}</td>
                  <td>{p.highlight ? "★" : ""}</td>
                  <td>{p.active ? "✔" : "hidden"}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="chip" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="chip" onClick={() => remove(p.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && <p>No pricing plans yet — add one below.</p>}
        </div>
      )}

      {!isEditingForm && (
        <button className="primary-btn" onClick={startNew}>
          + Add a new plan
        </button>
      )}

      {isEditingForm && (
        <div className="visual-block" style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="visual-title">{editingId === "new" ? "New plan" : "Edit plan"}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <label>
              Label
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. 1 Year"
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--paper-line)" }}
              />
            </label>
            <label>
              Price (GHS)
              <input
                type="number"
                value={form.price_ghs}
                onChange={(e) => setForm((f) => ({ ...f, price_ghs: e.target.value }))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--paper-line)" }}
              />
            </label>
            <label>
              Duration (months)
              <input
                type="number"
                value={form.months}
                onChange={(e) => setForm((f) => ({ ...f, months: e.target.value }))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--paper-line)" }}
              />
            </label>
            <label>
              Sort order
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--paper-line)" }}
              />
            </label>
          </div>

          <label style={{ display: "block", marginBottom: 10 }}>
            Note (optional, shown under the price)
            <input
              value={form.note || ""}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder='e.g. "The complete SHS 1-3 journey"'
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--paper-line)" }}
            />
          </label>

          <label style={{ marginRight: 16 }}>
            <input
              type="checkbox"
              checked={!!form.highlight}
              onChange={(e) => setForm((f) => ({ ...f, highlight: e.target.checked }))}
            />{" "}
            Highlight as "Best Value"
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />{" "}
            Visible to students
          </label>

          {form.price_ghs && form.months && (
            <p style={{ marginTop: 10, fontFamily: "var(--font-chalk)" }}>
              Works out to ≈ GHS {perMonth(form.price_ghs, form.months)} / month
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="primary-btn" onClick={save}>
              Save
            </button>
            <button className="chip" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
