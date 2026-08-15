"use client";

import { useTasksStore } from "@/hooks/useTasksStore";

export function CompletedTasksList() {
  const { completedTasks, restoreTask, deleteTask } = useTasksStore();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Выполнено</h2>

      {completedTasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400 dark:text-ink-faint">Пока нет выполненных задач</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/8">
          {completedTasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-400 line-through dark:text-ink-faint">
                {task.title}
              </span>
              <span className="shrink-0 text-right text-sm text-gray-300 dark:text-gray-600">{task.dueLabel}</span>
              <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
                <button
                  type="button"
                  onClick={() => restoreTask(task.id)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
                >
                  Вернуть
                </button>
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50"
                >
                  Удалить навсегда
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="pt-4 text-center text-sm text-gray-400 dark:text-ink-faint">{completedTasks.length} выполнено</p>
    </section>
  );
}
