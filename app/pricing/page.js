"use client";

import { useEffect, useState } from "react";
import { supabase, dbEnabled } from "../../lib/supabaseClient";
import { getPlanLabel } from "../../lib/planStatus";
import Footer from "../../components/Footer";

// Used only if Supabase isn't configured yet, or the pricing table is empty —
// keeps the page useful out of the box before an admin sets up real plans.
const FALLBACK_PLANS = [
  { label: "3 Months", price_ghs: 200, months: 3, note: null, highlight: false },
  { label: "1 Year", price_ghs: 1500, months: 12, note: "Full school year", highlight: false },
  { label: "2 Years", price_ghs: 2500, months: 24, note: null, highlight: false },
  { label: "3 Years", price_ghs: 3000, months: 36, note: "The complete SHS 1–3 journey", highlight: true },
];

function perMonth(price_ghs, months) {
  return (price_ghs / months).toFixed(1);
}

export default function PricingPage() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    loadPlans();
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

  async function loadPlans() {
    if (!dbEnabled) {
      setPlans(FALLBACK_PLANS);
      return;
    }
    const { data, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error || !data || data.length === 0) {
      setPlans(FALLBACK_PLANS);
      return;
    }
    setPlans(data);
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

      {plans && (
        <div className="pricing-grid">
          {plans.map((p) => (
            <div key={p.label} className={`pricing-card ${p.highlight ? "pricing-card-highlight" : ""}`}>
              {p.highlight && <div className="pricing-badge">Best Value</div>}
              <div className="pricing-plan-name">{p.label}</div>
              <div className="pricing-price">GHS {Number(p.price_ghs).toLocaleString()}</div>
              <div className="pricing-permonth">≈ GHS {perMonth(p.price_ghs, p.months)} / month</div>
              {p.note && <div className="pricing-note">{p.note}</div>}
              <a
                className="primary-btn"
                style={{ display: "inline-block", marginTop: 16, textAlign: "center" }}
                href={`https://wa.me/233547141279?text=${encodeURIComponent(
                  `Hi, I'd like to subscribe to the ${p.label} plan (GHS ${p.price_ghs}) on Learn With Glory.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe via WhatsApp
              </a>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: "center", color: "rgba(251,247,236,0.6)", fontSize: "0.85rem", marginTop: 20 }}>
        Payments are currently handled directly — message us on WhatsApp and an admin will activate your plan.
      </p>

      <Footer />
    </main>
  );
}
