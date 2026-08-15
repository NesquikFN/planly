import { tasksApi } from "@/lib/api-client";
import type { Task } from "@/types/task";

// Thin, named wrapper over the tasks endpoints — kept as its own module
// (rather than calling tasksApi straight from the store) so the store has
// one obvious seam to look at when persistence misbehaves.
//
// No method takes a userId anymore: the backend derives the owner from
// the session cookie and ignores anything the client might claim.
// snake_case <-> camelCase conversion is gone too — that now happens once,
// server-side, in the repository layer.

export function listTasks(): Promise<Task[]> {
  return tasksApi.list();
}

export function createTask(task: Task): Promise<Task> {
  return tasksApi.create(task);
}

export function updateTask(taskId: string, patch: Partial<Task>): Promise<Task> {
  return tasksApi.update(taskId, patch);
}

/**
 * Rejects when the task didn't exist (the API answers 404), which callers
 * rely on: toggleComplete only treats a completion as persisted once this
 * resolves, so a silent no-op here would let the local state and the
 * database disagree.
 */
export function deleteTask(taskId: string): Promise<void> {
  return tasksApi.remove(taskId);
}

/** Re-creates (or overwrites) a single task — used when restoring one pulled back out of the local Archive. */
export function restoreTask(task: Task): Promise<Task> {
  return tasksApi.replace(task);
}

/** Bulk insert for the one-time local-tasks migration. Never overwrites a row that already exists. */
export async function upsertTasks(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;
  await tasksApi.importMany(tasks);
}
