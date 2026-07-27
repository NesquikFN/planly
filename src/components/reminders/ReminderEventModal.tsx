"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";
import { getLocalDateKey } from "@/lib/date-utils";
import type { CalendarEventDraft } from "@/types/calendar";

export interface ReminderEventDefaults {
  title: string;
  date?: string;
  time?: string;
}

interface ReminderEventModalProps {
  open: boolean;
  defaults: ReminderEventDefaults | null;
  onClose: () => void;
  onCreated: (eventId: string) => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

function createEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ReminderEventModal({ open, defaults, onClose, onCreated }: ReminderEventModalProps) {
  const { calendars, createEvent } = useCalendarStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [calendarId, setCalendarId] = useState("");

  useEffect(() => {
    if (!open || !defaults) return;

    const initialStartTime = defaults.time || "09:00";
    setTitle(defaults.title);
    setDate(defaults.date || getLocalDateKey(new Date()));
    setStartTime(initialStartTime);
    setEndTime(minutesToTime(timeToMinutes(initialStartTime) + MIN_DURATION_MINUTES));
    setCalendarId((calendars.find((calendar) => calendar.visible) ?? calendars[0])?.id ?? "");
  }, [open, defaults, calendars]);

  if (!open || !defaults) return null;

  const selectedCalendar = calendars.find((calendar) => calendar.id === calendarId) ?? calendars[0];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime || !calendarId) return;

    const safeEndTime =
      timeToMinutes(endTime) > timeToMinutes(startTime)
        ? endTime
        : minutesToTime(timeToMinutes(startTime) + MIN_DURATION_MINUTES);
    const eventId = createEventId();

    // CalendarStore owns persistence. Its event writer preserves the supplied
    // identifier, which lets this reminder keep a real relation to that event
    // without a second events collection.
    const draftWithId: CalendarEventDraft & { id: string } = {
      id: eventId,
      title: title.trim(),
      date,
      startTime,
      endTime: safeEndTime,
      calendarId,
      important: false,
    };
    createEvent(draftWithId);
    onCreated(eventId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Новое событие</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className={labelClass}>Название</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Дата</span>
            <PlanlyDatePicker value={date} onChange={setDate} required />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Время начала</span>
              <PlanlyTimePicker value={startTime} onChange={setStartTime} required />
            </label>
            <label className="block">
              <span className={labelClass}>Время окончания</span>
              <PlanlyTimePicker value={endTime} onChange={setEndTime} required />
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Календарь</span>
            <div className="flex items-center gap-2">
              {selectedCalendar && <span className={`h-3 w-3 shrink-0 rounded-full ${calendarColorStyles[selectedCalendar.color].dot}`} />}
              <select value={calendarId} onChange={(event) => setCalendarId(event.target.value)} required className={inputClass}>
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800">
              Отмена
            </button>
            <button type="submit" disabled={calendars.length === 0} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              Создать событие
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
