"use client";

import { Flag, MoreVertical } from "lucide-react";
import { priorityStyles } from "@/lib/priority";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { useTasksStore } from "@/hooks/useTasksStore";
import type { Task } from "@/types/task";

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
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
      <div className="overflow-hidden">
        <div className="flex items-center gap-3 py-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleComplete(task.id)}
            aria-label={`Отметить задачу «${task.title}» выполненной`}
            className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-0"
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
              task.completed ? "text-gray-400 line-through" : `cursor-pointer ${styles.title}`
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
            className={`hidden shrink-0 sm:block ${task.completed ? "text-gray-200" : styles.flag}`}
          />
          <span
            className={`w-20 shrink-0 text-right text-sm ${task.completed ? "text-gray-300" : styles.due}`}
          >
            {task.dueLabel}
          </span>

          <DropdownMenu
            trigger={<MoreVertical size={16} />}
            triggerClassName="shrink-0 rounded p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500"
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
