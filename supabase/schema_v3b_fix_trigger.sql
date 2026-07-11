-- Run this if you're seeing "Database error creating new user" when
-- signing up, or when manually adding a user in Supabase's dashboard.
--
-- This replaces the trigger from schema_v3_auth.sql with a version that can
-- NEVER block account creation. Previously, if creating the profile row or
-- the matching student row failed for any reason, the whole sign-up failed
-- with a generic, unhelpful error. Now, each of those two inserts is
-- wrapped so a failure in one is logged as a warning (visible in Supabase's
-- Database Logs) instead of blocking the auth account from being created.
--
-- Safe to run this anytime, including if things are already working.

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
    insert into public.students (id, name)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
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
