"use client";

import { ArrowUpRight, Info } from "lucide-react";
import type { ProductivityScoreData } from "@/types/analytics";
import { periodComparisonLabel } from "@/lib/analytics-mock-data";
import type { AnalyticsPeriod } from "@/types/analytics";

interface ProductivityScoreProps {
  data: ProductivityScoreData;
  period: AnalyticsPeriod;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProductivityScore({ data, period }: ProductivityScoreProps) {
  const percent = (data.score / data.maxScore) * 100;
  const offset = CIRCUMFERENCE * (1 - percent / 100);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-1.5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
          Ваш результат за {period === "week" ? "неделю" : period === "month" ? "месяц" : period === "quarter" ? "квартал" : "год"}
        </h2>
        <div className="group relative">
          <button
            type="button"
            aria-label="Как считается индекс"
            className="rounded-full p-0.5 text-gray-300 hover:text-gray-400 dark:text-gray-600 dark:hover:text-gray-500"
          >
            <Info size={14} />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-gray-100 bg-white p-3 text-xs text-gray-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            Индекс формируется на основе выполненных задач, сроков, прогресса проектов и регулярности работы.
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
            <defs>
              <linearGradient id="score-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-gray-800" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke="url(#score-ring-gradient)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-50">{data.score}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">из {data.maxScore}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ArrowUpRight size={13} />
            На {data.deltaPercent}% лучше {periodComparisonLabel(period)}
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{data.explanation}</p>

          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {data.breakdown.map((item) => (
              <div key={item.key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                  <span className="text-gray-400 dark:text-gray-500">{item.value}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
