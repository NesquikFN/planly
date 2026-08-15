"use client";

import { CalendarClock, Clock3, Sparkles, Timer } from "lucide-react";
import { WEEKDAY_LABELS } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { CalendarTimeData } from "@/types/analytics";

// Planly has no time-tracked "focus sessions" anywhere in the data model —
// this card shows real scheduled calendar time instead (CalendarEvent
// start/end), which is the closest honest equivalent.

const INTENSITY_CLASSES = [
  "bg-gray-100 dark:bg-surface-2",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/70",
  "bg-accent",
];

function formatMinutesShort(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0 && mins === 0) return "0";
  return mins === 0 ? `${hours}ч` : `${hours}ч ${mins}м`;
}

export function FocusAnalytics({ data }: { data: CalendarTimeData }) {
  const maxMinutes = Math.max(1, ...data.dailyMinutes);
  const hasEvents = data.eventsCount > 0;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
      <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Время в календаре</h2>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-ink">{data.totalLabel}</p>

      <div className="mt-4 flex h-28 items-end gap-2">
        {data.dailyMinutes.map((minutes, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] text-gray-400 dark:text-ink-faint">{formatMinutesShort(minutes)}</span>
            <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-gray-100 dark:bg-surface-2">
              <div
                className="w-full rounded-md bg-accent"
                style={{ height: `${(minutes / maxMinutes) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 dark:text-ink-faint">{WEEKDAY_LABELS[index]}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-gray-100 pt-4 text-xs dark:border-white/8">
        <div className="flex items-center gap-2 text-gray-500 dark:text-ink-faint">
          <Sparkles size={14} className="shrink-0 text-accent" />
          Больше всего событий — <span className="font-medium text-gray-900 dark:text-ink">{data.bestDay ?? "нет данных"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-ink-faint">
          <Clock3 size={14} className="shrink-0 text-gray-400" />
          Загруженный час — <span className="font-medium text-gray-900 dark:text-ink">{data.busiestHourLabel ?? "нет данных"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-ink-faint">
          <Timer size={14} className="shrink-0 text-gray-400" />
          Средняя встреча — <span className="font-medium text-gray-900 dark:text-ink">{data.averageEventLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-ink-faint">
          <CalendarClock size={14} className="shrink-0 text-gray-400" />
          Событий за период — <span className="font-medium text-gray-900 dark:text-ink">{data.eventsCount}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-white/8">
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-ink-faint">События по часам</p>
        {hasEvents ? (
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-[3px]">
              <div className="flex gap-[3px] pl-6">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="w-4 text-center text-[9px] text-gray-400 dark:text-ink-faint">
                    {label}
                  </span>
                ))}
              </div>
              {data.hourLabels.map((hourLabel, hourIndex) => (
                <div key={hourLabel} className="flex items-center gap-[3px]">
                  <span className="w-6 shrink-0 text-right text-[9px] text-gray-400 dark:text-ink-faint">{hourLabel}</span>
                  {data.hourHeatmap.map((dayRow, dayIndex) => (
                    <span
                      key={dayIndex}
                      className={cn("h-4 w-4 rounded-[3px]", INTENSITY_CLASSES[dayRow[hourIndex]] ?? INTENSITY_CLASSES[0])}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-gray-400 dark:text-ink-faint">Нет событий в этом периоде</p>
        )}
      </div>
    </section>
  );
}
