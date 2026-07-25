"use client";

import { Flame, Trophy } from "lucide-react";
import { formatShortDate, fromISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { ActivityHeatmapData } from "@/types/analytics";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function daysWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

const INTENSITY_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-blue-100 dark:bg-blue-500/20",
  "bg-blue-300 dark:bg-blue-500/40",
  "bg-blue-500 dark:bg-blue-500/70",
  "bg-blue-700 dark:bg-blue-400",
];

export function ActivityHeatmap({ data }: { data: ActivityHeatmapData }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Регулярность</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">{data.monthLabel}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60">
          <Flame size={15} className="shrink-0 text-orange-500" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Активных подряд</p>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              {data.currentStreak} {daysWord(data.currentStreak)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60">
          <Trophy size={15} className="shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Лучший результат</p>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              {data.bestStreak} {daysWord(data.bestStreak)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800/60">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">В этом месяце</p>
            <p className="font-semibold text-gray-900 dark:text-gray-50">
              {data.activeDaysThisMonth} из {data.totalDaysThisMonth}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
              {label}
            </span>
          ))}
          {data.days.map((day) => (
            <div key={day.dateKey} className="group relative flex items-center justify-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md text-[10px]",
                  day.inCurrentMonth ? INTENSITY_CLASSES[day.intensity] : "bg-transparent text-gray-200 dark:text-gray-700",
                  day.inCurrentMonth && day.intensity >= 3 ? "text-white" : "text-gray-500 dark:text-gray-400",
                )}
              >
                {day.dayOfMonth}
              </span>
              {day.inCurrentMonth && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-100 bg-white px-2.5 py-1.5 text-[11px] text-gray-600 shadow-sm group-hover:block dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                  {day.tasksCompleted > 0
                    ? `${formatShortDate(fromISODate(day.dateKey))} — выполнено ${day.tasksCompleted} задач, ${day.focusMinutesLabel} фокус-времени`
                    : `${formatShortDate(fromISODate(day.dateKey))} — активности не было`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
