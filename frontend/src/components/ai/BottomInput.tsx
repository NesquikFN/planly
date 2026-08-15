"use client";

import { useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useClock } from "@/hooks/useClock";
import { addDays, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type CreateType = "task" | "event";

/**
 * Quick-create only sets a title, a date (today, or tomorrow if the text
 * says so — same heuristic as createTaskFromText in task-parser.ts), and a
 * default 09:00–10:00 slot. Full date/time/calendar editing stays on the
 * existing EventModal (opened from the Calendar page) — this is a shortcut,
 * not a replacement.
 */
function buildEventDraftFromText(text: string, today: Date, calendarId: string) {
  const title = text.trim();
  const isTomorrow = title.toLowerCase().includes("завтра");
  return {
    title,
    date: toISODate(isTomorrow ? addDays(today, 1) : today),
    startTime: "09:00",
    endTime: "10:00",
    calendarId,
    important: false,
  };
}

export function BottomInput() {
  const [value, setValue] = useState("");
  const [createType, setCreateType] = useState<CreateType>("task");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Synchronous lock, checked before React state has a chance to re-render —
  // a state flag alone can't catch two calls to handleSubmit landing in the
  // same tick (double Enter, Enter racing the button's click).
  const submittingRef = useRef(false);

  const { addTaskFromText } = useTasksStore();
  const { createEvent, calendars } = useCalendarStore();
  const { today } = useClock();

  function handleSubmit() {
    const text = value.trim();
    if (!text || submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);

    if (createType === "event") {
      const calendarId = calendars[0]?.id;
      if (calendarId) createEvent(buildEventDraftFromText(text, today, calendarId));
    } else {
      addTaskFromText(text);
    }

    setValue("");
    // Released next frame — long enough to absorb a same-tick double-fire,
    // short enough to never block the next, separate submission.
    requestAnimationFrame(() => {
      submittingRef.current = false;
      setIsSubmitting(false);
    });
  }

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center gap-1 self-start rounded-lg bg-gray-50 p-0.5 text-xs font-medium dark:bg-surface-2">
        <button
          type="button"
          onClick={() => setCreateType("task")}
          aria-pressed={createType === "task"}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            createType === "task"
              ? "bg-white text-gray-900 shadow-sm dark:bg-surface dark:text-ink"
              : "text-gray-400 hover:text-gray-600 dark:text-ink-faint dark:hover:text-ink-dim",
          )}
        >
          Задача
        </button>
        <button
          type="button"
          onClick={() => setCreateType("event")}
          aria-pressed={createType === "event"}
          className={cn(
            "rounded-md px-2.5 py-1 transition-colors",
            createType === "event"
              ? "bg-white text-gray-900 shadow-sm dark:bg-surface dark:text-ink"
              : "text-gray-400 hover:text-gray-600 dark:text-ink-faint dark:hover:text-ink-dim",
          )}
        >
          Событие
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="flex h-[54px] items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 transition-colors focus-within:border-gray-300 dark:border-white/8 dark:bg-surface-2 dark:focus-within:border-white/20"
      >
        <Sparkles size={17} className="shrink-0 text-gray-300 dark:text-ink-faint" />
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={createType === "event" ? "Напишите событие…" : "Напишите задачу…"}
          disabled={isSubmitting}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 dark:text-ink dark:placeholder:text-ink-faint"
        />
        <button
          type="submit"
          disabled={!value.trim() || isSubmitting}
          aria-label="Отправить"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
