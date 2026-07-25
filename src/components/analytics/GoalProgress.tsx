"use client";

import { cn } from "@/lib/utils";
import type { Goal } from "@/types/analytics";

export function GoalProgress({ goals, onTrackLabel }: { goals: Goal[]; onTrackLabel: string }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Прогресс целей</h2>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{onTrackLabel}</span>
      </div>

      <div className="mt-4 space-y-4">
        {goals.map((goal) => (
          <div key={goal.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{goal.title}</span>
              <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-50">{goal.percent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={cn("h-full rounded-full", goal.onTrack ? "bg-blue-600" : "bg-amber-400")}
                style={{ width: `${goal.percent}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>{goal.detail}</span>
              <span>Срок: {goal.dueLabel}</span>
            </div>
            {!goal.onTrack && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                Стоит уделить этой цели чуть больше внимания на следующей неделе
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
