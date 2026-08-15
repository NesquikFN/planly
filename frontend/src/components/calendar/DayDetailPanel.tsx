"use client";

import { useEffect, useState } from "react";
import { CheckSquare, ChevronLeft, Clock, Plus, Repeat, Square, Trash2, X } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { WEEKDAY_OPTIONS } from "@/lib/task-recurrence";
import { formatFullDateLabel, isSameDay, toISODate } from "@/lib/date-utils";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";
import { MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PlanlyTimePicker } from "@/components/ui/PlanlyTimePicker";
import { cn } from "@/lib/utils";

const RECURRING_PREVIEW_COUNT = 3;

function pluralizeEvents(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "событие";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "события";
  return "событий";
}

/**
 * The persistent "selected day" panel — always visible on the Calendar page
 * (not a modal/popup). Two modes, both driven by existing store state:
 *  - no selection (or a task selected) -> day view: date, event count, a
 *    lightweight timeline of the day's entries, "add event".
 *  - an event selected -> inspector: the same fields EventModal exposes,
 *    edited inline via the same updateEvent/deleteEvent actions. Nothing
 *    about how those actions work changes; this is a different UI surface
 *    for the same store calls, replacing the modal for editing specifically
 *    (creation still opens EventModal, unchanged).
 */
export function DayDetailPanel() {
  const {
    today,
    anchorDate,
    events,
    entriesByDate,
    visibleEntries,
    calendars,
    calendarById,
    selectedEntryId,
    openEntryEditor,
    openEditModal,
    selectEntry,
    toggleEntryComplete,
    openCreateModal,
    updateEvent,
    deleteEvent,
  } = useCalendarStore();

  const selectedEntry = visibleEntries.find((entry) => entry.id === selectedEntryId);
  const selectedEvent = selectedEntry?.kind === "event" ? events.find((event) => event.id === selectedEntry.sourceId) : undefined;

  if (selectedEntry?.kind === "event" && selectedEvent) {
    return <EventInspector event={selectedEvent} occurrenceDate={selectedEntry.date} onClose={() => selectEntry(null)} calendars={calendars} updateEvent={updateEvent} deleteEvent={deleteEvent} />;
  }

  if (selectedEntry?.kind === "task") {
    return <TaskSummary entry={selectedEntry} onOpen={() => openEntryEditor(selectedEntry)} onToggle={() => toggleEntryComplete(selectedEntry)} onClose={() => selectEntry(null)} />;
  }

  return (
    <DayOverview
      today={today}
      anchorDate={anchorDate}
      events={events}
      entriesByDate={entriesByDate}
      calendarById={calendarById}
      selectEntry={selectEntry}
      openEntryEditor={openEntryEditor}
      openEditModal={openEditModal}
      toggleEntryComplete={toggleEntryComplete}
      openCreateModal={openCreateModal}
    />
  );
}

interface DayOverviewProps {
  today: Date;
  anchorDate: Date;
  events: ReturnType<typeof useCalendarStore>["events"];
  entriesByDate: ReturnType<typeof useCalendarStore>["entriesByDate"];
  calendarById: ReturnType<typeof useCalendarStore>["calendarById"];
  selectEntry: ReturnType<typeof useCalendarStore>["selectEntry"];
  openEntryEditor: ReturnType<typeof useCalendarStore>["openEntryEditor"];
  openEditModal: ReturnType<typeof useCalendarStore>["openEditModal"];
  toggleEntryComplete: ReturnType<typeof useCalendarStore>["toggleEntryComplete"];
  openCreateModal: ReturnType<typeof useCalendarStore>["openCreateModal"];
}

function DayOverview({
  today,
  anchorDate,
  events,
  entriesByDate,
  calendarById,
  selectEntry,
  openEntryEditor,
  openEditModal,
  toggleEntryComplete,
  openCreateModal,
}: DayOverviewProps) {
  const [showAllRecurring, setShowAllRecurring] = useState(false);

  const iso = toISODate(anchorDate);
  const dayEntries = entriesByDate.get(iso) ?? [];
  const isToday = isSameDay(anchorDate, today);
  const dateLabel = formatFullDateLabel(anchorDate);

  const recurringSeries = events.filter((event) => event.recurrence && event.recurrence.rule !== "none" && !event.seriesId);
  const visibleRecurring = showAllRecurring ? recurringSeries : recurringSeries.slice(0, RECURRING_PREVIEW_COUNT);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col gap-6 lg:w-[340px]">
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold capitalize text-gray-900 dark:text-ink">{dateLabel}</h2>
            {isToday && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                Сегодня
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-ink-faint">
            {dayEntries.length === 0 ? "Ничего не запланировано" : `${dayEntries.length} ${pluralizeEvents(dayEntries.length)}`}
          </p>
        </div>

        {dayEntries.length > 0 && (
          <ul className="relative mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto border-l border-gray-100 pl-3 dark:border-white/8">
            {dayEntries.map((entry) => {
              const styles = calendarColorStyles[entry.color];
              const sourceEvent = entry.kind === "event" ? events.find((event) => event.id === entry.sourceId) : undefined;
              const calendarName = entry.kind === "task" ? "Задача" : (calendarById.get(sourceEvent?.calendarId ?? "")?.name ?? "Событие");

              return (
                <li key={entry.id} className="relative">
                  <span className={cn("absolute -left-[15px] top-3 h-2 w-2 rounded-full", styles.dot)} />
                  <button
                    type="button"
                    onClick={() => {
                      selectEntry(entry.id);
                      if (entry.kind === "task") openEntryEditor(entry);
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    {entry.kind === "task" && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(domEvent) => {
                          domEvent.stopPropagation();
                          toggleEntryComplete(entry);
                        }}
                        className="mt-0.5 shrink-0 text-gray-400 dark:text-ink-faint"
                      >
                        {entry.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-gray-900 dark:text-ink">
                        {entry.title}
                        {entry.isRecurring && <Repeat size={11} className="shrink-0 text-gray-300 dark:text-ink-faint" />}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-ink-faint">
                        {calendarName}
                        {sourceEvent?.description ? ` · ${sourceEvent.description}` : ""}
                      </p>
                    </div>
                    {entry.startTime && (
                      <span className="shrink-0 text-right text-xs tabular-nums text-gray-400 dark:text-ink-faint">
                        {entry.startTime}
                        {entry.kind === "event" && entry.endTime ? ` – ${entry.endTime}` : ""}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => openCreateModal({ date: iso })}
          className="mt-4 inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
        >
          <Plus size={15} />
          Добавить событие
        </button>
      </section>

      {recurringSeries.length > 0 && (
        <section className="shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Повторяющиеся события</h3>
          <ul className="mt-3 space-y-2.5">
            {visibleRecurring.map((event) => {
              const styles = calendarColorStyles[calendarById.get(event.calendarId)?.color ?? "blue"];
              const days = (event.recurrence?.weekdays ?? [])
                .map((day) => WEEKDAY_OPTIONS.find((option) => option.key === day)?.label)
                .filter(Boolean)
                .join(", ");
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => openEditModal(event.id)}
                    className="flex w-full items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  >
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", styles.block)}>
                      <Repeat size={13} className={styles.text} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-ink">{event.title}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-ink-faint">
                        {days} · {event.startTime}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {recurringSeries.length > RECURRING_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllRecurring((value) => !value)}
              className="mt-3 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-ink-faint dark:hover:text-ink-dim"
            >
              {showAllRecurring ? "Скрыть" : `Показать все (${recurringSeries.length})`}
            </button>
          )}
        </section>
      )}
    </aside>
  );
}

interface TaskSummaryProps {
  entry: ReturnType<typeof useCalendarStore>["visibleEntries"][number];
  onOpen: () => void;
  onToggle: () => void;
  onClose: () => void;
}

// Tasks keep their own editor (TaskEditModal) — this is just a quick summary
// with a link into it, not a duplicate task form inline.
function TaskSummary({ entry, onOpen, onToggle, onClose }: TaskSummaryProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col lg:w-[340px]">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 dark:text-ink-faint dark:hover:text-ink-dim"
          >
            {entry.completed ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-gray-900 dark:text-ink">{entry.title}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="shrink-0 text-gray-300 hover:text-gray-500 dark:text-ink-faint">
            <X size={16} />
          </button>
        </div>
        {entry.startTime && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-400 dark:text-ink-faint">
            <Clock size={13} />
            {entry.startTime}
          </p>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Изменить задачу
        </button>
      </section>
    </aside>
  );
}

interface EventInspectorProps {
  event: NonNullable<ReturnType<typeof useCalendarStore>["events"][number]>;
  occurrenceDate: string;
  onClose: () => void;
  calendars: ReturnType<typeof useCalendarStore>["calendars"];
  updateEvent: ReturnType<typeof useCalendarStore>["updateEvent"];
  deleteEvent: ReturnType<typeof useCalendarStore>["deleteEvent"];
}

// The inline replacement for "open EventModal to edit" — same fields, same
// updateEvent/deleteEvent calls, just rendered in the persistent panel
// instead of a dialog. Recurrence rule itself isn't editable here yet (see
// report); everything else (title/date/time/calendar/description) is.
function EventInspector({ event, occurrenceDate, onClose, calendars, updateEvent, deleteEvent }: EventInspectorProps) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [calendarId, setCalendarId] = useState(event.calendarId);
  const [description, setDescription] = useState(event.description ?? "");

  useEffect(() => {
    setTitle(event.title);
    setDate(event.date);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setCalendarId(event.calendarId);
    setDescription(event.description ?? "");
  }, [event]);

  const isRecurring = Boolean(event.recurrence && event.recurrence.rule !== "none");
  const recurringDays = isRecurring
    ? (event.recurrence?.weekdays ?? []).map((day) => WEEKDAY_OPTIONS.find((option) => option.key === day)?.label).filter(Boolean).join(", ")
    : "";

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== event.title) updateEvent(event.id, { title: trimmed });
    else setTitle(event.title);
  }

  function commitDescription() {
    const trimmed = description.trim();
    if (trimmed !== (event.description ?? "")) updateEvent(event.id, { description: trimmed || undefined });
  }

  function commitDate(next: string) {
    setDate(next);
    if (next) updateEvent(event.id, { date: next });
  }

  function commitStartTime(next: string) {
    setStartTime(next);
    if (!next) return;
    const safeEnd = timeToMinutes(endTime) > timeToMinutes(next) ? endTime : minutesToTime(timeToMinutes(next) + MIN_DURATION_MINUTES);
    setEndTime(safeEnd);
    updateEvent(event.id, { startTime: next, endTime: safeEnd });
  }

  function commitEndTime(next: string) {
    setEndTime(next);
    if (next) updateEvent(event.id, { endTime: next });
  }

  function commitCalendar(next: string) {
    setCalendarId(next);
    updateEvent(event.id, { calendarId: next });
  }

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col lg:w-[340px]">
      <section className="flex h-full min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-ink-faint dark:hover:text-ink-dim"
          >
            <ChevronLeft size={14} />
            Назад
          </button>
          <button
            type="button"
            onClick={() => {
              deleteEvent(event.id);
              onClose();
            }}
            aria-label="Удалить событие"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:text-ink-faint dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            className="w-full rounded-lg border border-transparent bg-transparent px-1 text-base font-semibold text-gray-900 focus:border-gray-200 focus:bg-gray-50 focus:outline-none dark:text-ink dark:focus:border-white/8 dark:focus:bg-surface-2"
          />

          {isRecurring && (
            <p className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-ink-faint">
              <Repeat size={12} />
              Повторяется: {recurringDays || "—"} · показан occurrence на {occurrenceDate}
            </p>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-dim">Дата</span>
              <PlanlyDatePicker value={date} onChange={commitDate} />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-dim">Начало</span>
              <PlanlyTimePicker value={startTime} onChange={commitStartTime} />
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-dim">Конец</span>
              <PlanlyTimePicker value={endTime} onChange={commitEndTime} />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-dim">Календарь</span>
            <select
              value={calendarId}
              onChange={(e) => commitCalendar(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-ink-dim">Описание</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              rows={3}
              placeholder="Без описания"
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim dark:placeholder:text-ink-faint"
            />
          </div>
        </div>
      </section>
    </aside>
  );
}
