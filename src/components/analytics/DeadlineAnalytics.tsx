"use client";

import { CalendarCheck, Clock3, TrendingDown, TrendingUp } from "lucide-react";
import { WEEKDAY_LABELS } from "@/lib/analytics";
import type { DeadlineAnalyticsData } from "@/types/analytics";

export function DeadlineAnalytics({ data }: { data: DeadlineAnalyticsData }) {
  const hasCurrent = data.onTimePercent !== null;
  const hasBoth = hasCurrent && data.previousPeriodPercent !== null;
  const delta = hasBoth ? data.onTimePercent! - data.previousPeriodPercent! : null;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
      <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Соблюдение сроков</h2>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900 dark:text-ink">{hasCurrent ? `${data.onTimePercent}%` : "—"}</span>
        <span className="text-sm text-gray-400 dark:text-ink-faint">
          {hasCurrent ? "задач выполнено вовремя" : "нет завершённых задач с датой в периоде"}
        </span>
      </div>

      {hasCurrent && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-ink-faint">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Текущий период — {data.onTimePercent}%
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-400 dark:text-ink-faint">
            <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-white/20" />
            Прошлый период — {data.previousPeriodPercent !== null ? `${data.previousPeriodPercent}%` : "нет данных"}
          </span>
          {delta !== null && delta !== 0 && (
            <span className={`inline-flex items-center gap-1 font-medium ${delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {delta > 0 ? "+" : ""}
              {delta}%
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex h-24 items-end gap-2">
        {data.weekdayOnTime.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-gray-100 dark:bg-surface-2">
              {value !== null && <div className="w-full rounded-md bg-accent" style={{ height: `${value}%` }} />}
            </div>
            <span className="text-[11px] text-gray-400 dark:text-ink-faint">{WEEKDAY_LABELS[index]}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-gray-100 pt-4 text-sm dark:border-white/8">
        <div className="flex items-center gap-2.5 text-gray-500 dark:text-ink-faint">
          <Clock3 size={15} className="shrink-0 text-gray-400 dark:text-ink-faint" />
          Среднее опоздание — <span className="font-medium text-gray-900 dark:text-ink">{data.averageLateLabel}</span>
        </div>
        <div className="flex items-center gap-2.5 text-gray-500 dark:text-ink-faint">
          <CalendarCheck size={15} className="shrink-0 text-emerald-500" />
          Самый дисциплинированный день —{" "}
          <span className="font-medium text-gray-900 dark:text-ink">{data.mostDisciplinedDay ?? "нет данных"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-gray-500 dark:text-ink-faint">
          <Clock3 size={15} className="shrink-0 text-amber-500" />
          Больше всего просрочек — <span className="font-medium text-gray-900 dark:text-ink">{data.mostOverdueDay ?? "нет данных"}</span>
        </div>
      </div>
    </section>
  );
}
