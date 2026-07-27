"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useTasksStore } from "@/hooks/useTasksStore";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { RECURRENCE_RULE_OPTIONS, WEEKDAY_OPTIONS, localWeekdayIndex, weekdaysForRule } from "@/lib/task-recurrence";
import { fromISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { TaskRecurrenceRule } from "@/types/task";

export function TaskEditModal() {
  const { tasks, today, editingTaskId, cancelEditing, saveTaskEdit, deleteTask } = useTasksStore();
  const task = editingTaskId ? tasks.find((item) => item.id === editingTaskId) : undefined;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [important, setImportant] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrenceRule>("none");
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([]);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(task.date ?? "");
    setTime(task.time ?? "");
    setImportant(task.important);
    setRecurrenceRule(task.recurrence?.rule ?? "none");
    setCustomWeekdays(task.recurrence?.rule === "custom" ? task.recurrence.weekdays : []);
  }, [task]);

  if (!task) return null;

  const needsCustomDays = recurrenceRule === "custom";
  const canSubmit = !needsCustomDays || customWeekdays.length > 0;

  function toggleWeekday(day: number) {
    setCustomWeekdays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day].sort((a, b) => a - b)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={cancelEditing}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Редактировать задачу</h3>
          <button
            type="button"
            onClick={cancelEditing}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            const pickedDays =
              recurrenceRule === "weekly" ? [localWeekdayIndex(date ? fromISODate(date) : today)] : customWeekdays;
            const recurrence =
              recurrenceRule === "none"
                ? undefined
                : { rule: recurrenceRule, weekdays: weekdaysForRule(recurrenceRule, pickedDays), time: time || undefined };
            saveTaskEdit(task.id, { title, date, time, important, recurrence });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Название</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Дата</span>
              <PlanlyDatePicker
                value={date}
                onChange={(next) => {
                  setDate(next);
                  if (!next) setTime("");
                }}
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Время</span>
              <PlanlyTimePicker value={time} onChange={setTime} disabled={!date} />
            </label>
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-0 dark:border-gray-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">Важная задача</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Повторять</span>
            <select
              value={recurrenceRule}
              onChange={(event) => setRecurrenceRule(event.target.value as TaskRecurrenceRule)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {RECURRENCE_RULE_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {needsCustomDays && (
            <div>
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Дни недели</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => toggleWeekday(option.key)}
                    aria-pressed={customWeekdays.includes(option.key)}
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-medium transition-colors",
                      customWeekdays.includes(option.key)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {!canSubmit && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">Выберите хотя бы один день</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              aria-label="Удалить задачу"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} />
              Удалить
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
