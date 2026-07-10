-- Run this in Supabase's SQL Editor AFTER schema_v3_auth.sql.
-- Adds a pricing_plans table so plans are editable from /admin instead of
-- hardcoded in the app — and per-month cost is computed automatically from
-- price_ghs / months, so a bad-value tier is obvious immediately as you type.

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  price_ghs numeric not null,
  months int not null,
  note text,
  highlight boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.pricing_plans enable row level security;

create policy "Anyone can read pricing plans"
  on public.pricing_plans for select
  using (true);

-- Deliberately no insert/update/delete policy for regular users — only the
-- admin API routes (using the service-role key, after checking the caller
-- is an admin) can write plans.

-- Seed the four plans already discussed, only if the table is currently
-- empty (safe to run this file more than once without duplicating rows).
insert into public.pricing_plans (label, price_ghs, months, note, highlight, sort_order)
select * from (values
  ('3 Months', 200, 3, null, false, 1),
  ('1 Year', 1500, 12, 'Full school year', false, 2),
  ('2 Years', 2500, 24, null, false, 3),
  ('3 Years', 3000, 36, 'The complete SHS 1–3 journey', true, 4)
) as v(label, price_ghs, months, note, highlight, sort_order)
where not exists (select 1 from public.pricing_plans);
