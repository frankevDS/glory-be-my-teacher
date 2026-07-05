-- Run this in Supabase's SQL Editor AFTER schema.sql and schema_v2_history.sql.
-- Adds real accounts (email + password) with an admin-approval gate — for
-- when you're ready to control who can use the app, e.g. ahead of a paid
-- subscription launch.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Deliberately NO update policy for regular users here. Role/status changes
-- only happen through the server-side admin API route, which uses the
-- secret service-role key and checks the caller is an admin first. If users
-- could update their own row directly, they could just set role='admin'
-- themselves — that's why this is locked down at the database level, not
-- just hidden in the UI.

-- Automatically creates a profile ("pending") whenever someone signs up, and
-- also a matching row in the existing `students` table using the SAME id.
-- That one detail means everything you already built — study history, the
-- leaderboard, the dashboard, spaced repetition — keeps working unchanged
-- once someone logs in; their account and their "student" record are just
-- the same id under the hood.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'pending'
  );

  insert into public.students (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- HOW TO BECOME YOUR OWN FIRST ADMIN:
-- 1. Deploy with the new env vars (see README), then sign up through the app
--    once, using your own real email.
-- 2. Come back here and run (with YOUR email):
--
--    update public.profiles set role = 'admin', status = 'approved'
--    where email = 'you@example.com';
--
-- From then on, sign in and visit /admin to approve everyone else.
