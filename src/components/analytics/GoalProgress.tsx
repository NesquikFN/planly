"use client";

import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types/analytics";

// Planly has no goals feature/store anywhere in the app yet, so this stays a
// honest empty state rather than inventing personal goals — the moment a
// real goals store exists, this component only needs its `goals` prop fed.
export function GoalProgress({ goals }: { goals: Goal[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Прогресс целей</h2>
        {goals.length > 0 && (
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            {goals.filter((goal) => goal.onTrack).length} из {goals.length} по плану
          </span>
        )}
      </div>

      {goals.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-gray-800">
          <Target size={22} className="text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Цели пока не отслеживаются</p>
          <p className="mt-1 max-w-xs text-xs text-gray-400 dark:text-gray-500">
            В Planly пока нет отдельного раздела целей — здесь появится прогресс, когда он будет добавлен.
          </p>
        </div>
      ) : (
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
