-- Run this once in your Supabase project's SQL Editor (Project → SQL Editor → New query).
-- Free tier is plenty for this: 500MB database, no credit card required.

create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  country text not null,
  level text not null,
  track text,
  subject text not null,
  topic text not null,
  score int not null,
  total int not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: anyone with the public anon key can submit a score and
-- read the leaderboard, but nobody can edit or delete existing rows through
-- the API. This is deliberately simple for a family/small-school app — if you
-- later open this to the public internet at scale, you'll want to add rate
-- limiting and stricter validation (e.g. via a server-side API route instead
-- of direct client inserts).

alter table public.leaderboard enable row level security;

create policy "Anyone can read the leaderboard"
  on public.leaderboard for select
  using (true);

create policy "Anyone can submit a score"
  on public.leaderboard for insert
  with check (
    score >= 0 and score <= total and
    char_length(student_name) between 1 and 60 and
    char_length(subject) between 1 and 80 and
    char_length(topic) between 1 and 120
  );

-- Helpful index for the common leaderboard query (top scores for a subject+topic).
create index if not exists leaderboard_subject_topic_idx
  on public.leaderboard (country, subject, topic, score desc);
