-- Planly: calendar_events table — schema for recurring calendar event
-- series, matching the client model in src/types/calendar.ts.
--
-- NOT WIRED UP YET: the Calendar module (src/hooks/useCalendarStore.tsx)
-- still runs entirely on localStorage, same as before this migration —
-- Tasks was the only entity moved to Supabase so far (see
-- docs/supabase-data-migration-plan.md). This migration only prepares the
-- table so the next phase (wiring useCalendarStore to Supabase, the same
-- way useTasksStore already is) doesn't also need a schema change.
--
-- Recurrence is never expanded into one row per occurrence — a recurring
-- series is ONE row with `recurrence_rule`/`recurrence_weekdays`/
-- `recurrence_until`; occurrences are computed on read (see
-- src/lib/calendar-recurrence.ts for the equivalent client-side logic).
-- `skipped_dates` holds per-occurrence skip/delete exceptions as plain date
-- keys (see migration note below for why, not a separate table).
-- `series_id` lets a single row override one specific occurrence (changed
-- time/title for just that date) without forking a whole new series or
-- writing one row per future week.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  all_day boolean not null default false,
  calendar_id text not null default 'personal',
  important boolean not null default false,
  timezone text not null default 'UTC',

  -- Recurrence — null rule/absent weekdays = a plain one-off event.
  recurrence_rule text,
  recurrence_weekdays int[],
  recurrence_until date,

  -- Exceptions. A plain jsonb array of "YYYY-MM-DD" keys, not a separate
  -- table: exceptions are always looked up by "does this series skip this
  -- one date", never queried independently, never joined against, and a
  -- single series realistically accumulates a handful of them at most — a
  -- separate table would need its own RLS policies and FK plumbing for no
  -- read/write pattern this app actually has. If that changes (e.g.
  -- per-exception metadata beyond "skipped"), split it out then.
  skipped_dates jsonb not null default '[]'::jsonb,

  -- Present only on an override row: which series (this table's own id)
  -- this row replaces one occurrence of. A series' own row always has this
  -- null; an override row always has recurrence_rule null (it's a single
  -- occurrence, not a series itself).
  series_id uuid references public.calendar_events (id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_events_time_order check (end_time > start_time)
);

alter table public.calendar_events enable row level security;

drop policy if exists "calendar_events_select_own" on public.calendar_events;
create policy "calendar_events_select_own"
  on public.calendar_events for select
  using (auth.uid() = user_id);

drop policy if exists "calendar_events_insert_own" on public.calendar_events;
create policy "calendar_events_insert_own"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "calendar_events_update_own" on public.calendar_events;
create policy "calendar_events_update_own"
  on public.calendar_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "calendar_events_delete_own" on public.calendar_events;
create policy "calendar_events_delete_own"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

create index if not exists calendar_events_user_id_idx on public.calendar_events (user_id);
create index if not exists calendar_events_user_id_date_idx on public.calendar_events (user_id, date);
create index if not exists calendar_events_series_id_idx on public.calendar_events (series_id) where series_id is not null;

create or replace function public.handle_calendar_events_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_calendar_event_updated on public.calendar_events;
create trigger on_calendar_event_updated
  before update on public.calendar_events
  for each row execute function public.handle_calendar_events_updated_at();
