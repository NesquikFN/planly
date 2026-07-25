"use client";

import { useMemo } from "react";
import { useTasksStore } from "@/hooks/useTasksStore";
import { computeWeeklyProgress } from "@/lib/weekly-progress";
import { cn } from "@/lib/utils";

const CHART_WIDTH = 240;
const CHART_HEIGHT = 56;
const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function buildPoints(percents: number[]): string {
  const step = CHART_WIDTH / (percents.length - 1);
  return percents
    .map((value, index) => {
      const x = index * step;
      const y = CHART_HEIGHT - (value / 100) * CHART_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ProgressCard() {
  const { tasks, today } = useTasksStore();
  const result = useMemo(() => computeWeeklyProgress(tasks, today), [tasks, today]);
  const points = useMemo(() => buildPoints(result.dailyPercents), [result.dailyPercents]);
  const todayIndex = (today.getDay() + 6) % 7; // Monday-first: Mon=0 ... Sun=6

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Прогресс</h3>

      {result.total === 0 ? (
        <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">На этой неделе пока нет задач</p>
      ) : (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="mt-3 h-14 w-full"
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke="#2563eb"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      <div className="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
        {WEEKDAY_LABELS.map((day, index) => (
          <span key={day} className={cn(index === todayIndex && "font-semibold text-gray-600 dark:text-gray-300")}>
            {day}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Выполнено за неделю</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-50">
            {result.completed} из {result.total}
          </p>
        </div>
        <p className="text-base font-semibold text-blue-600">{result.percent}%</p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${result.percent}%` }} />
      </div>
    </section>
  );
}
