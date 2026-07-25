"use client";

import { useState } from "react";
import { CheckCircle2, Target } from "lucide-react";
import { useTasksStore } from "@/hooks/useTasksStore";
import { priorityStyles } from "@/lib/priority";
import type { TaskPriority } from "@/types/task";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  overdue: "Просрочено",
  important: "Важно сегодня",
  upcoming: "Скоро",
  none: "Без срока",
};

export function FocusCard() {
  const { focusStatus, eligibleFocusTasks, setManualFocus, clearFocus } = useTasksStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  function pickTask(id: string) {
    setManualFocus(id);
    setPickerOpen(false);
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Фокус дня</h3>
        <Target size={16} className="text-gray-300 dark:text-gray-600" />
      </div>

      {focusStatus.kind === "empty" && (
        <div className="mt-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">На сегодня фокус не выбран</p>
          <button
            type="button"
            onClick={() => setPickerOpen((value) => !value)}
            className="mt-3 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Выбрать задачу
          </button>
        </div>
      )}

      {focusStatus.kind === "completed" && (
        <div className="mt-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 size={15} />
            Фокус выполнен
          </p>
          <p className="mt-2 truncate text-sm text-gray-400 line-through dark:text-gray-500">{focusStatus.task.title}</p>
          <button
            type="button"
            onClick={clearFocus}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Выбрать следующую задачу
          </button>
        </div>
      )}

      {focusStatus.kind === "active" && (
        <div className="mt-3">
          <p className="text-base font-semibold leading-snug text-gray-900 dark:text-gray-50">{focusStatus.task.title}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-block border-b-2 border-amber-400 pb-0.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              {focusStatus.task.dueLabel}
            </span>
            <span
              className={cn(
                "rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium dark:bg-gray-800",
                priorityStyles[focusStatus.task.priority].due,
              )}
            >
              {PRIORITY_LABELS[focusStatus.task.priority]}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setPickerOpen((value) => !value)}
              className="font-medium text-blue-600 hover:underline"
            >
              Сменить фокус
            </button>
            <button
              type="button"
              onClick={clearFocus}
              className="font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              Убрать из фокуса
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="mt-3 max-h-48 space-y-0.5 overflow-y-auto border-t border-gray-100 pt-3 dark:border-gray-800">
          {eligibleFocusTasks.length === 0 ? (
            <p className="px-1 text-xs text-gray-400 dark:text-gray-500">Нет доступных задач</p>
          ) : (
            eligibleFocusTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => pickTask(task.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <span className="truncate text-gray-700 dark:text-gray-200">{task.title}</span>
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{task.dueLabel}</span>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
