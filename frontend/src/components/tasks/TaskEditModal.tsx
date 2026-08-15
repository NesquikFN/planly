"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { RECURRENCE_RULE_OPTIONS, WEEKDAY_OPTIONS, localWeekdayIndex, weekdaysForRule } from "@/lib/task-recurrence";
import { fromISODate, toISODate } from "@/lib/date-utils";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";
import { cn } from "@/lib/utils";
import type { TaskRecurrenceRule } from "@/types/task";

export function TaskEditModal() {
  const { tasks, today, editingTaskId, cancelEditing, saveTaskEdit, deleteTask } = useTasksStore();
  const { calendars, createEvent } = useCalendarStore();
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

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-ink">Редактировать задачу</h3>
          <button
            type="button"
            onClick={cancelEditing}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;

            // Repetition is no longer a Task concept — a picked rule always
            // becomes a Calendar event series instead, never a saved
            // Task.recurrence. Declining just drops the rule; the task saves
            // as a plain one-off with whatever title/date/time was entered.
            if (recurrenceRule !== "none") {
              const convert = window.confirm(
                "Повторяющиеся задачи теперь хранятся как события календаря. Преобразовать «" +
                  title +
                  "» в повторяющееся событие? Задача будет удалена, событие появится в календаре.",
              );
              if (convert) {
                const pickedDays =
                  recurrenceRule === "weekly" ? [localWeekdayIndex(date ? fromISODate(date) : today)] : customWeekdays;
                const weekdays = weekdaysForRule(recurrenceRule, pickedDays);
                const eventDate = date || toISODate(today);
                const startTime = time || "09:00";
                const endTime = minutesToTime(timeToMinutes(startTime) + 60);
                const calendarId = calendars[0]?.id;
                if (calendarId) {
                  createEvent({
                    title: title.trim() || task.title,
                    date: eventDate,
                    startTime,
                    endTime,
                    calendarId,
                    important,
                    recurrence: { rule: recurrenceRule, weekdays },
                  });
                  deleteTask(task.id);
                  cancelEditing();
                  return;
                }
              }
            }

            saveTaskEdit(task.id, { title, date, time, important, recurrence: undefined });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Название</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
            />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Дата</span>
              <PlanlyDatePicker
                value={date}
                onChange={(next) => {
                  setDate(next);
                  if (!next) setTime("");
                }}
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Время</span>
              <PlanlyTimePicker value={time} onChange={setTime} disabled={!date} />
            </label>
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-accent focus:ring-0 dark:border-white/20"
            />
            <span className="text-sm text-gray-600 dark:text-ink-dim">Важная задача</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Повторять</span>
            <select
              value={recurrenceRule}
              onChange={(event) => setRecurrenceRule(event.target.value as TaskRecurrenceRule)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
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
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Дни недели</span>
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
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-surface-2 dark:text-ink-faint dark:hover:bg-surface",
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
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
