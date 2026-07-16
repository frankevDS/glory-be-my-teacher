-- Run this in Supabase's SQL Editor AFTER schema_v3_auth.sql.
-- The `students` table only ever stored a name, never an email — so if two
-- accounts share the same display name (e.g. two different sign-ups both
-- named "Aderemi Evelyn"), there was no way to tell them apart on the
-- Parent/Teacher Dashboard's student picker. This adds email, backfills it
-- for accounts that already exist, and updates the sign-up trigger so every
-- new account gets it automatically going forward.

alter table public.students
  add column if not exists email text;

-- Backfill: every student row created via sign-up has the same id as its
-- matching profiles row (that's how they're linked) — pull the email from
-- there for any student row that's missing one.
update public.students s
set email = p.email
from public.profiles p
where s.id = p.id
  and s.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, email, name, role, status)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      'user',
      'pending'
    )
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: profiles insert failed for %: %', new.id, sqlerrm;
  end;

  begin
    insert into public.students (id, name, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email
    )
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: students insert failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
