"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, CheckSquare, Square } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export function TodayCalendarCard() {
  const router = useRouter();
  const { today, entriesByDate, openTodayInDayView, toggleEntryComplete, openEntryEditor, selectEntry } =
    useCalendarStore();

  const entries = entriesByDate.get(toISODate(today)) ?? [];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Сегодня в календаре</h3>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">Сегодня событий нет</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {entries.map((entry) => {
            const styles = calendarColorStyles[entry.color];
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectEntry(entry.id);
                    openEntryEditor(entry);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg text-left text-sm hover:bg-gray-50"
                >
                  {entry.kind === "task" ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(domEvent) => {
                        domEvent.stopPropagation();
                        toggleEntryComplete(entry);
                      }}
                      className="shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      {entry.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                    </span>
                  ) : (
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                  )}
                  <span className="shrink-0 tabular-nums text-gray-400">
                    {entry.allDay ? "Весь день" : entry.startTime}
                  </span>
                  <span className="truncate text-gray-700">{entry.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => {
          openTodayInDayView();
          router.push("/calendar");
        }}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
      >
        Открыть календарь
        <ArrowRight size={14} />
      </button>
    </section>
  );
}
