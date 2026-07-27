"use client";

import { CalendarClock, Clock3, Sparkles, Timer } from "lucide-react";
import { WEEKDAY_LABELS } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { CalendarTimeData } from "@/types/analytics";

// Planly has no time-tracked "focus sessions" anywhere in the data model —
// this card shows real scheduled calendar time instead (CalendarEvent
// start/end), which is the closest honest equivalent.

const INTENSITY_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-blue-100 dark:bg-blue-500/20",
  "bg-blue-300 dark:bg-blue-500/40",
  "bg-blue-500 dark:bg-blue-500/70",
  "bg-blue-700 dark:bg-blue-400",
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
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Время в календаре</h2>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">{data.totalLabel}</p>

      <div className="mt-4 flex h-28 items-end gap-2">
        {data.dailyMinutes.map((minutes, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatMinutesShort(minutes)}</span>
            <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
              <div
                className="w-full rounded-md bg-indigo-500"
                style={{ height: `${(minutes / maxMinutes) * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{WEEKDAY_LABELS[index]}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-gray-100 pt-4 text-xs dark:border-gray-800">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Sparkles size={14} className="shrink-0 text-indigo-500" />
          Больше всего событий — <span className="font-medium text-gray-900 dark:text-gray-50">{data.bestDay ?? "нет данных"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Clock3 size={14} className="shrink-0 text-gray-400" />
          Загруженный час — <span className="font-medium text-gray-900 dark:text-gray-50">{data.busiestHourLabel ?? "нет данных"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Timer size={14} className="shrink-0 text-gray-400" />
          Средняя встреча — <span className="font-medium text-gray-900 dark:text-gray-50">{data.averageEventLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <CalendarClock size={14} className="shrink-0 text-gray-400" />
          Событий за период — <span className="font-medium text-gray-900 dark:text-gray-50">{data.eventsCount}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">События по часам</p>
        {hasEvents ? (
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-[3px]">
              <div className="flex gap-[3px] pl-6">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="w-4 text-center text-[9px] text-gray-400 dark:text-gray-500">
                    {label}
                  </span>
                ))}
              </div>
              {data.hourLabels.map((hourLabel, hourIndex) => (
                <div key={hourLabel} className="flex items-center gap-[3px]">
                  <span className="w-6 shrink-0 text-right text-[9px] text-gray-400 dark:text-gray-500">{hourLabel}</span>
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
          <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">Нет событий в этом периоде</p>
        )}
      </div>
    </section>
  );
}
