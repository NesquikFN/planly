"use client";

import { Flag, MoreVertical, Target } from "lucide-react";
import { priorityStyles } from "@/lib/priority";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useTasksStore } from "@/hooks/useTasksStore";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";

interface TaskRowProps {
  task: Task;
  /** True when this is today's focus task (see useTasksStore's focusStatus) — marks the row instead of showing focus as its own card. */
  isFocus?: boolean;
}

export function TaskRow({ task, isFocus = false }: TaskRowProps) {
  const {
    toggleComplete,
    setManualFocus,
    startEditing,
    postponeToTomorrow,
    toggleImportant,
    deleteTask,
    exitingIds,
  } = useTasksStore();

  const styles = priorityStyles[task.priority];
  const isExiting = exitingIds.has(task.id);

  return (
    <li
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out ${
        isExiting ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
      }`}
    >
      <div className={isExiting ? "overflow-hidden" : undefined}>
        <div
          className={cn(
            "-mx-2 flex items-center gap-3 rounded-lg border-l-2 px-2 py-3 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-white/[0.03]",
            isFocus ? "border-accent" : "border-transparent",
          )}
        >
          {isFocus && <Target size={13} className="-ml-1 shrink-0 text-accent" aria-label="Фокус дня" />}
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleComplete(task.id)}
            aria-label={`Отметить задачу «${task.title}» выполненной`}
            className="h-4 w-4 shrink-0 rounded border-gray-300 accent-accent focus:ring-0 dark:border-white/20 dark:bg-transparent"
          />
          <span
            role="button"
            tabIndex={0}
            onClick={() => !task.completed && setManualFocus(task.id)}
            onKeyDown={(event) => {
              if (!task.completed && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                setManualFocus(task.id);
              }
            }}
            title="Выбрать как фокус дня"
            className={`flex-1 truncate text-sm font-medium ${
              task.completed ? "text-gray-400 line-through dark:text-ink-faint" : `cursor-pointer dark:text-ink ${styles.title}`
            }`}
          >
            {task.title}
            {task.important && !task.completed && (
              <span className="ml-1.5 align-middle text-amber-400">★</span>
            )}
          </span>
          <Flag
            size={14}
            fill="currentColor"
            className={`hidden shrink-0 sm:block ${task.completed ? "text-gray-200 dark:text-white/10" : styles.flag}`}
          />
          <span
            className={`w-20 shrink-0 text-right text-sm tabular-nums ${task.completed ? "text-gray-300 dark:text-ink-faint" : styles.due}`}
          >
            {task.dueLabel}
          </span>

          <DropdownMenu
            trigger={<MoreVertical size={16} />}
            triggerClassName="shrink-0 rounded p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim"
            triggerAriaLabel="Действия с задачей"
            items={[
              { key: "edit", label: "Редактировать", onSelect: () => startEditing(task.id) },
              {
                key: "tomorrow",
                label: "Перенести на завтра",
                onSelect: () => postponeToTomorrow(task.id),
              },
              {
                key: "important",
                label: task.important ? "Убрать из важных" : "Сделать важной",
                onSelect: () => toggleImportant(task.id),
              },
              {
                key: "delete",
                label: "Удалить",
                onSelect: () => deleteTask(task.id),
                destructive: true,
              },
            ]}
          />
        </div>
      </div>
    </li>
  );
}
