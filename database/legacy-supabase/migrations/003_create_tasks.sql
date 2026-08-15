-- Planly: tasks table — cloud persistence for the Dashboard/Tasks module.
-- Columns mirror the actual `Task` app type (src/types/task.ts) exactly, not
-- a hypothetical richer model: no description/status/project_id/tags —
-- those fields don't exist on Task today. Safe to re-run: table creation is
-- IF NOT EXISTS, policies/indexes/trigger are dropped-and-recreated or
-- IF NOT EXISTS.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  due_label text not null default '',
  priority text not null default 'none',
  completed boolean not null default false,
  important boolean not null default false,
  date date,
  time time,
  completed_at timestamptz,
  recurrence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
  on public.tasks for delete
  using (auth.uid() = user_id);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_id_priority_idx on public.tasks (user_id, priority);
create index if not exists tasks_user_id_date_idx on public.tasks (user_id, date);

create or replace function public.handle_tasks_updated_at()
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

drop trigger if exists on_task_updated on public.tasks;
create trigger on_task_updated
  before update on public.tasks
  for each row execute function public.handle_tasks_updated_at();
