"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";
import { toISODate } from "@/lib/date-utils";

export function EventModal() {
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
  const [task, setTask] = useState("");

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
      setTask(editingEvent.task ?? "");
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
      setTask(defaults.task ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState, editingEvent]);

  if (!modalState) return null;

  const selectedCalendar = calendars.find((cal) => cal.id === calendarId) ?? calendars[0];

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!modalState || !title.trim() || !date || !startTime || !endTime || !calendarId) return;

    const safeEndTime =
      timeToMinutes(endTime) > timeToMinutes(startTime)
        ? endTime
        : minutesToTime(timeToMinutes(startTime) + MIN_DURATION_MINUTES);

    const payload = {
      title: title.trim(),
      date,
      startTime,
      endTime: safeEndTime,
      calendarId,
      important,
      description: description.trim() || undefined,
      project: project.trim() || undefined,
      task: task.trim() || undefined,
    };

    if (modalState.mode === "edit") {
      updateEvent(modalState.eventId, payload);
    } else {
      createEvent(payload);
    }
    closeModal();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/20" onClick={closeModal} aria-hidden="true" />

      <div className="relative max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            {modalState.mode === "edit" ? "Редактировать событие" : "Новое событие"}
          </h3>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Название</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Дата</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500">Время начала</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500">Время окончания</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Календарь</span>
            <div className="flex items-center gap-2">
              {selectedCalendar && (
                <span className={`h-3 w-3 shrink-0 rounded-full ${calendarColorStyles[selectedCalendar.color].dot}`} />
              )}
              <select
                value={calendarId}
                onChange={(event) => setCalendarId(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              >
                {calendars.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="mt-1 block text-xs text-gray-400">Цвет события берётся из выбранного календаря.</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-0"
            />
            <span className="text-sm text-gray-600">Важное событие</span>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Описание</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500">Проект (необязательно)</span>
              <input
                type="text"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500">Задача (необязательно)</span>
              <input
                type="text"
                value={task}
                onChange={(event) => setTask(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
