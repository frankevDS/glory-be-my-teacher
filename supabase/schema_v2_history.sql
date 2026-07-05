-- Run this in Supabase's SQL Editor AFTER schema.sql (the leaderboard one).
-- Adds: student profiles (so siblings/classmates can share one deployment),
-- study history (for the parent/teacher dashboard), and a spaced-repetition
-- queue of missed quiz questions.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;

create policy "Anyone can read students"
  on public.students for select
  using (true);

create policy "Anyone can add a student"
  on public.students for insert
  with check (char_length(name) between 1 and 60);


create table if not exists public.study_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  country text not null,
  level text not null,
  track text,
  subject text not null,
  topic text not null,
  activity_type text not null check (activity_type in ('lesson', 'quiz')),
  score int,
  total int,
  created_at timestamptz not null default now()
);

alter table public.study_history enable row level security;

create policy "Anyone can read study history"
  on public.study_history for select
  using (true);

create policy "Anyone can log study history"
  on public.study_history for insert
  with check (true);

create index if not exists study_history_student_idx
  on public.study_history (student_id, created_at desc);


create table if not exists public.quiz_mistakes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  country text not null,
  subject text not null,
  topic text not null,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  reviewed_count int not null default 0,
  next_review_at timestamptz not null default (now() + interval '1 day'),
  created_at timestamptz not null default now()
);

alter table public.quiz_mistakes enable row level security;

create policy "Anyone can read mistakes"
  on public.quiz_mistakes for select
  using (true);

create policy "Anyone can log a mistake"
  on public.quiz_mistakes for insert
  with check (true);

create policy "Anyone can update their review schedule"
  on public.quiz_mistakes for update
  using (true);

create policy "Anyone can clear a mastered mistake"
  on public.quiz_mistakes for delete
  using (true);

create index if not exists quiz_mistakes_due_idx
  on public.quiz_mistakes (student_id, next_review_at);

-- Security note (same spirit as schema.sql): these policies are wide open by
-- design for a simple family/small-school deployment with no login system.
-- If this ever goes properly public, move writes behind a server-side API
-- route with real per-user auth instead of direct client access.
