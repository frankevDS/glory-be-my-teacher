"use client";

import { useEffect, useState } from "react";
import { supabase, dbEnabled } from "../../lib/supabaseClient";
import { getPlanLabel } from "../../lib/planStatus";
import Footer from "../../components/Footer";

const PLANS = [
  { label: "3 Months", price: "GHS 200", perMonth: "≈ GHS 66.7 / month", months: 3 },
  { label: "1 Year", price: "GHS 1,500", perMonth: "≈ GHS 125 / month", months: 12, note: "Full school year" },
  { label: "2 Years", price: "GHS 2,500", perMonth: "≈ GHS 104.2 / month", months: 24 },
  {
    label: "3 Years",
    price: "GHS 3,000",
    perMonth: "≈ GHS 83.3 / month",
    months: 36,
    note: "The complete SHS 1–3 journey",
    highlight: true,
  },
];

export default function PricingPage() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!dbEnabled) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.session.user.id).single();
        setProfile(prof);
      }
    });
  }, []);

  return (
    <main className="wrap">
      <a
        href="/"
        style={{ color: "var(--paper)", fontFamily: "var(--font-display)", display: "inline-block", marginBottom: 16 }}
      >
        ← Back home
      </a>

      <section className="hero">
        <span className="chalk-tag">Invest in the full journey ✎</span>
        <h1>Pricing</h1>
        <p>Full access to every subject, every country, every feature — AI lessons, quizzes, puzzles, and more.</p>
        {session && profile && (
          <p style={{ color: "var(--chalk-yellow)", fontFamily: "var(--font-chalk)" }}>
            Your current plan: {getPlanLabel(profile)}
          </p>
        )}
        {session === null && (
          <p style={{ color: "rgba(251,247,236,0.7)" }}>
            Sign in from the home page to see your current plan status here.
          </p>
        )}
      </section>

      <div className="pricing-grid">
        {PLANS.map((p) => (
          <div key={p.label} className={`pricing-card ${p.highlight ? "pricing-card-highlight" : ""}`}>
            {p.highlight && <div className="pricing-badge">Best Value</div>}
            <div className="pricing-plan-name">{p.label}</div>
            <div className="pricing-price">{p.price}</div>
            <div className="pricing-permonth">{p.perMonth}</div>
            {p.note && <div className="pricing-note">{p.note}</div>}
            <a
              className="primary-btn"
              style={{ display: "inline-block", marginTop: 16, textAlign: "center" }}
              href={`https://wa.me/233547141279?text=${encodeURIComponent(
                `Hi, I'd like to subscribe to the ${p.label} plan (${p.price}) on Learn With Glory.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Subscribe via WhatsApp
            </a>
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", color: "rgba(251,247,236,0.6)", fontSize: "0.85rem", marginTop: 20 }}>
        Payments are currently handled directly — message us on WhatsApp and an admin will activate your plan.
      </p>

      <Footer />
    </main>
  );
}
