"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";
import { fromISODate, toISODate } from "@/lib/date-utils";
import { RECURRENCE_RULE_OPTIONS, WEEKDAY_OPTIONS, localWeekdayIndex, weekdaysForRule } from "@/lib/task-recurrence";
import { cn } from "@/lib/utils";
import type { TaskRecurrenceRule } from "@/types/task";

export function EventModal({ onSaved }: { onSaved?: (mode: "create" | "edit", eventId: string) => void } = {}) {
  const { modalState, closeModal, events, calendars, createEvent, updateEvent, deleteEvent } = useCalendarStore();
  const editingEvent =
    modalState?.mode === "edit" ? events.find((event) => event.id === modalState.eventId) : undefined;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [important, setImportant] = useState(false);
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("");
  const [projectId, setProjectId] = useState<string | undefined>();
  const [task, setTask] = useState("");
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrenceRule>("none");
  const [customWeekdays, setCustomWeekdays] = useState<number[]>([]);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  // Guards a fast double-submit (Enter + click, double Enter) from firing
  // createEvent/updateEvent twice — the store's own per-id guard can't help
  // a brand-new event, which has no id until this call returns one.
  const submittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!modalState) return;

    if (modalState.mode === "edit" && editingEvent) {
      setTitle(editingEvent.title);
      setDate(editingEvent.date);
      setStartTime(editingEvent.startTime);
      setEndTime(editingEvent.endTime);
      setCalendarId(editingEvent.calendarId);
      setImportant(editingEvent.important);
      setDescription(editingEvent.description ?? "");
      setProject(editingEvent.project ?? "");
      setProjectId(editingEvent.projectId);
      setTask(editingEvent.task ?? "");
      setRecurrenceRule(editingEvent.recurrence?.rule ?? "none");
      setCustomWeekdays(editingEvent.recurrence?.rule === "custom" ? editingEvent.recurrence.weekdays : []);
      setRecurrenceUntil(editingEvent.recurrence?.until ?? "");
    } else if (modalState.mode === "create") {
      const defaults = modalState.defaults;
      setTitle(defaults.title ?? "");
      setDate(defaults.date ?? toISODate(new Date()));
      setStartTime(defaults.startTime ?? "09:00");
      setEndTime(defaults.endTime ?? "10:00");
      setCalendarId(defaults.calendarId ?? calendars[0]?.id ?? "");
      setImportant(defaults.important ?? false);
      setDescription(defaults.description ?? "");
      setProject(defaults.project ?? "");
      setProjectId(defaults.projectId);
      setTask(defaults.task ?? "");
      setRecurrenceRule("none");
      setCustomWeekdays([]);
      setRecurrenceUntil("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState, editingEvent]);

  if (!modalState) return null;

  const selectedCalendar = calendars.find((cal) => cal.id === calendarId) ?? calendars[0];
  const needsCustomDays = recurrenceRule === "custom";
  const canSubmit = !needsCustomDays || customWeekdays.length > 0;

  function toggleWeekday(day: number) {
    setCustomWeekdays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day].sort((a, b) => a - b)));
  }

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!modalState || !title.trim() || !date || !startTime || !endTime || !calendarId || !canSubmit) return;
    // Same-tick double-submit guard (double Enter, Enter racing the submit
    // button click) — createEvent has no id yet to key a store-level guard on.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    const safeEndTime =
      timeToMinutes(endTime) > timeToMinutes(startTime)
        ? endTime
        : minutesToTime(timeToMinutes(startTime) + MIN_DURATION_MINUTES);

    const pickedDays = recurrenceRule === "weekly" ? [localWeekdayIndex(fromISODate(date))] : customWeekdays;
    const recurrence =
      recurrenceRule === "none"
        ? undefined
        : { rule: recurrenceRule, weekdays: weekdaysForRule(recurrenceRule, pickedDays), until: recurrenceUntil || undefined };

    const payload = {
      title: title.trim(),
      date,
      startTime,
      endTime: safeEndTime,
      calendarId,
      important,
      description: description.trim() || undefined,
      project: project.trim() || undefined,
      projectId,
      task: task.trim() || undefined,
      recurrence,
    };

    if (modalState.mode === "edit") {
      updateEvent(modalState.eventId, payload);
      onSaved?.("edit", modalState.eventId);
    } else {
      const created = createEvent(payload);
      onSaved?.("create", created.id);
    }
    requestAnimationFrame(() => {
      submittingRef.current = false;
      setIsSubmitting(false);
    });
    closeModal();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/20" onClick={closeModal} aria-hidden="true" />

      <div className="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-ink">
            {modalState.mode === "edit" ? "Редактировать событие" : "Новое событие"}
          </h3>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Название</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Дата</span>
            <PlanlyDatePicker value={date} onChange={setDate} required />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Время начала</span>
              <PlanlyTimePicker value={startTime} onChange={setStartTime} required />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Время окончания</span>
              <PlanlyTimePicker value={endTime} onChange={setEndTime} required />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Календарь</span>
            <div className="flex items-center gap-2">
              {selectedCalendar && (
                <span className={`h-3 w-3 shrink-0 rounded-full ${calendarColorStyles[selectedCalendar.color].dot}`} />
              )}
              <select
                value={calendarId}
                onChange={(event) => setCalendarId(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="mt-1 block text-xs text-gray-400 dark:text-ink-faint">Цвет события берётся из выбранного календаря.</span>
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

          {recurrenceRule !== "none" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Повторять до (необязательно)</span>
              <PlanlyDatePicker value={recurrenceUntil} onChange={setRecurrenceUntil} />
            </label>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-0 dark:border-gray-600"
            />
            <span className="text-sm text-gray-600 dark:text-ink-dim">Важное событие</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
            />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Проект (необязательно)</span>
              <input
                type="text"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-faint">Задача (необязательно)</span>
              <input
                type="text"
                value={task}
                onChange={(event) => setTask(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {modalState.mode === "edit" ? (
              <button
                type="button"
                onClick={() => {
                  if (modalState.mode === "edit") deleteEvent(modalState.eventId);
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Удалить
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
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
