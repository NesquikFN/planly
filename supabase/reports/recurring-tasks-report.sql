-- Read-only report: recurring tasks left over from before repetition moved
-- from Tasks to Calendar event series (see docs/supabase-data-migration-plan.md,
-- "Recurring tasks -> calendar events" section).
--
-- Nothing here writes, deletes, or migrates anything. Run each query in the
-- Supabase SQL Editor to decide what (if anything) needs manual migration.
-- `recurrence` is jsonb shaped like { rule, weekdays, time? } — see
-- src/types/task.ts's (legacy) TaskRecurrence.

-- 1. How many recurring tasks exist right now, and for how many distinct users.
select
  count(*) filter (where recurrence is not null and recurrence->>'rule' <> 'none') as recurring_task_count,
  count(distinct user_id) filter (where recurrence is not null and recurrence->>'rule' <> 'none') as affected_users
from public.tasks;

-- 2. Per-user breakdown, oldest first — useful for reaching out to a specific
-- user or migrating one account at a time instead of all at once.
select
  user_id,
  count(*) as recurring_task_count,
  min(created_at) as oldest_recurring_task,
  max(created_at) as newest_recurring_task
from public.tasks
where recurrence is not null and recurrence->>'rule' <> 'none'
group by user_id
order by recurring_task_count desc;

-- 3. Full listing — one row per recurring task, with everything the
-- "convert to calendar event" flow needs (see TaskEditModal.tsx's own
-- in-app version of this same conversion, done one task at a time by the
-- user). Use this to eyeball what a bulk migration would actually produce
-- before running one.
select
  id,
  user_id,
  title,
  date,
  time,
  recurrence->>'rule' as recurrence_rule,
  recurrence->'weekdays' as recurrence_weekdays,
  completed,
  created_at
from public.tasks
where recurrence is not null and recurrence->>'rule' <> 'none'
order by user_id, created_at;
