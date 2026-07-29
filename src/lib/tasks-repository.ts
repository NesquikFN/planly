import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/types/task";

// The only place that talks to `public.tasks`. Every method takes an
// explicit userId (always sourced from the authenticated session, never from
// a form) and filters/stamps rows with it — RLS enforces the same rule
// server-side, this is just so a bug here fails closed instead of relying on
// RLS alone. snake_case (DB) <-> camelCase (Task) conversion happens only here.

interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  due_label: string;
  priority: string;
  completed: boolean;
  important: boolean;
  date: string | null;
  time: string | null;
  completed_at: string | null;
  recurrence: Task["recurrence"] | null;
  created_at: string;
  updated_at: string;
}

function requireClient(): SupabaseClient {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase не настроен.");
  return supabase;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    dueLabel: row.due_label,
    priority: row.priority as Task["priority"],
    completed: row.completed,
    important: row.important,
    date: row.date ?? undefined,
    time: row.time ? row.time.slice(0, 5) : undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    recurrence: row.recurrence ?? undefined,
  };
}

function taskToRow(task: Task, userId: string): Omit<TaskRow, "updated_at"> {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    due_label: task.dueLabel,
    priority: task.priority,
    completed: task.completed,
    important: task.important,
    date: task.date ?? null,
    time: task.time ?? null,
    completed_at: task.completedAt ?? null,
    recurrence: task.recurrence ?? null,
    created_at: task.createdAt ?? new Date().toISOString(),
  };
}

/** Only the keys actually present in `patch` are translated — a partial DB update, not a full row replace. */
function partialTaskToRow(patch: Partial<Task>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.dueLabel !== undefined) row.due_label = patch.dueLabel;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.completed !== undefined) row.completed = patch.completed;
  if (patch.important !== undefined) row.important = patch.important;
  if (patch.date !== undefined) row.date = patch.date ?? null;
  if (patch.time !== undefined) row.time = patch.time ?? null;
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt ?? null;
  if (patch.recurrence !== undefined) row.recurrence = patch.recurrence ?? null;
  return row;
}

export async function listTasks(userId: string): Promise<Task[]> {
  const supabase = requireClient();
  const { data, error } = await supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as TaskRow[]).map(rowToTask);
}

export async function createTask(userId: string, task: Task): Promise<Task> {
  const supabase = requireClient();
  const row = taskToRow(task, userId);

  if (process.env.NODE_ENV !== "production") {
    // Payload only — title/date/etc, never a token or session value.
    console.debug("[tasks:createTask] insert payload", row);
  }

  const { data, error } = await supabase.from("tasks").insert(row).select().single();

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[tasks:createTask] insert failed", {
        userId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    }
    throw error;
  }

  return rowToTask(data as TaskRow);
}

export async function updateTask(userId: string, taskId: string, patch: Partial<Task>): Promise<Task> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(partialTaskToRow(patch))
    .eq("id", taskId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return rowToTask(data as TaskRow);
}

/**
 * Supabase's `.delete()` doesn't error when the filter matches zero rows — it
 * just silently deletes nothing. Callers (toggleComplete) create the next
 * recurring occurrence only after this resolves without throwing, so a
 * silent no-op here would let a next occurrence get created while the
 * current task never actually left the table. `.select("id")` forces the
 * no-op to surface as a thrown error instead.
 */
export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const supabase = requireClient();
  const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId).select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(`Задача ${taskId} не найдена в базе — удаление не выполнено.`);
  }
}

/** Re-creates (or overwrites) a single task row — used when restoring a task pulled back out of the local Archive. */
export async function restoreTask(userId: string, task: Task): Promise<Task> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("tasks")
    .upsert(taskToRow(task, userId), { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return rowToTask(data as TaskRow);
}

/** Bulk insert for the one-time local-tasks migration. Never overwrites a row that already exists. */
export async function upsertTasks(userId: string, tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;
  const supabase = requireClient();
  const { error } = await supabase
    .from("tasks")
    .upsert(
      tasks.map((task) => taskToRow(task, userId)),
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) throw error;
}
