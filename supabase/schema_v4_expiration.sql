-- Run this in Supabase's SQL Editor AFTER schema_v3_auth.sql.
-- Adds an optional expiry date to each account, so approving someone can
-- mean "approved for 3 months" instead of forever — the natural shape for
-- a paid subscription.

alter table public.profiles
  add column if not exists expires_at timestamptz;

-- No RLS changes needed: expires_at is written the same way status/role
-- are — only through the admin API route, using the service-role key.
