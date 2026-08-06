"use client";

import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import type { ProductivityScoreData } from "@/types/analytics";
import { periodComparisonLabel } from "@/lib/analytics";
import type { AnalyticsPeriod } from "@/types/analytics";

interface ProductivityScoreProps {
  data: ProductivityScoreData;
  period: AnalyticsPeriod;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProductivityScore({ data, period }: ProductivityScoreProps) {
  const hasScore = data.score !== null;
  const percent = hasScore ? (data.score! / data.maxScore) * 100 : 0;
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-ink">
          Ваш результат за{" "}
          {period === "week"
            ? "неделю"
            : period === "month"
              ? "месяц"
              : period === "quarter"
                ? "квартал"
                : period === "all"
                  ? "всё время"
                  : "год"}
        </h2>
        <div className="group relative">
          <button
            type="button"
            aria-label="Как считается индекс"
            className="rounded-full p-0.5 text-gray-300 hover:text-gray-400 dark:text-ink-faint dark:hover:text-ink-dim"
          >
            <Info size={14} />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-3 text-xs text-gray-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:border-white/8 dark:bg-surface dark:text-ink-faint dark:shadow-none">
            Индекс формируется на основе выполненных задач, соблюдения сроков, отсутствия просрочек, регулярности активности и планирования в календаре.
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-white/10" />
            {hasScore && (
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke="#ff5a1f"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
              />
            )}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-semibold text-gray-900 dark:text-ink">{hasScore ? data.score : "—"}</span>
            <span className="text-xs text-gray-400 dark:text-ink-faint">из {data.maxScore}</span>
          </div>
        </div>

        <div className="flex-1">
          {data.trend.kind === "up" && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ArrowUpRight size={13} />
              На {data.trend.percent}% лучше по сравнению с {periodComparisonLabel(period)}
            </div>
          )}
          {data.trend.kind === "down" && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <ArrowDownRight size={13} />
              На {Math.abs(data.trend.percent ?? 0)}% хуже по сравнению с {periodComparisonLabel(period)}
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-ink-faint">{data.explanation}</p>

          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {data.breakdown.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600 dark:text-ink-dim">{item.label}</span>
                  <span className="text-gray-400 dark:text-ink-faint">{item.value !== null ? `${item.value}%` : "нет данных"}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-surface-2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${item.value ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
