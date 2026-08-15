-- Planly: extend profiles with the fields needed to unify Settings → Profile
-- (previously split between the Supabase "Аккаунт" block and the old local
-- Planly profile). Safe to re-run: every column add is IF NOT EXISTS, and the
-- trigger function is replaced idempotently. Does not touch 001's table,
-- policies, or the updated_at trigger.

alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists company text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists timezone text;
alter table public.profiles add column if not exists language text;

-- RLS stays as set up in 001 (row-level policies apply to every column,
-- including the new ones): users can only select/insert/update the profiles
-- row whose id matches their own auth.uid().

-- Re-provision new users with first_name/display_name in addition to
-- full_name/email, sourced from signUp's user_metadata when available.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_full_name text := new.raw_user_meta_data ->> 'full_name';
  meta_first_name text := coalesce(new.raw_user_meta_data ->> 'first_name', nullif(split_part(coalesce(meta_full_name, ''), ' ', 1), ''));
  meta_display_name text := coalesce(new.raw_user_meta_data ->> 'display_name', meta_full_name);
begin
  insert into public.profiles (id, email, full_name, first_name, display_name)
  values (new.id, new.email, meta_full_name, meta_first_name, meta_display_name)
  on conflict (id) do nothing;
  return new;
end;
$$;
