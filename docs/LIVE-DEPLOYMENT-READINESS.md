# Learn With Glory — Live Deployment Readiness

## Production trust rule

Production defaults to `CURRICULUM_TRUST_MODE=strict` unless explicitly overridden.
Strict mode means AI lessons, quizzes and topic discovery require a verified official curriculum index for the selected country/subject.

## Required Vercel variables

- `GROQ_API_KEY` — server-only; never prefix with `NEXT_PUBLIC_`.
- `GROQ_MODEL` — optional; use the tested Groq model configured for the deployment.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; never expose it to the browser.
- `NEXT_PUBLIC_REQUIRE_APPROVAL=true` for a controlled live launch.
- `SUPER_ADMIN_EMAIL` — recommended for protecting the primary admin account.
- `CURRICULUM_TRUST_MODE=strict`

## Pre-launch checks

1. Run the complete Supabase schema in order through `schema_v9_live_security.sql`.
2. Create the first account and promote it to admin using the server-side SQL procedure described in `schema_v3_auth.sql`.
3. Visit `/api/health` after deployment and confirm AI + Supabase configuration.
4. Confirm the health response reports the expected number of `verified` curriculum indexes.
5. Do not switch a subject to verified until its source is an official NaCCA/approved examination-authority document.
6. Test sign-up, approval, expiry, admin controls and logout with a second test account.
7. Test a verified subject end-to-end: topic selection → lesson → quiz → review → dashboard.
8. Test an unverified subject and confirm strict mode refuses AI teaching rather than silently inventing a syllabus.
9. Test RLS by attempting to read/update another user's study history, mistakes or presence from the browser client; it must fail.
10. Deploy only after a clean `next build` in the same Node.js environment used by Vercel.

## Academic safety rule

AI-generated practice questions are never labelled as authentic past questions. Authentic past questions must carry provenance and source metadata.
