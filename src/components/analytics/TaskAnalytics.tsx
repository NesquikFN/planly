"use client";

import { ArrowRight } from "lucide-react";
import type { TaskAnalyticsData } from "@/types/analytics";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  dot: string;
}

interface TaskAnalyticsProps {
  data: TaskAnalyticsData;
  onOpenTasks: () => void;
}

export function TaskAnalytics({ data, onOpenTasks }: TaskAnalyticsProps) {
  const total = data.completed + data.pending + data.overdue;
  const totalForRing = total || 1;

  const segments: Segment[] = [
    { key: "completed", label: "Выполнено", value: data.completed, color: "#10b981", dot: "bg-emerald-500" },
    { key: "pending", label: "В работе", value: data.pending, color: "#2563eb", dot: "bg-blue-600" },
    { key: "overdue", label: "Просрочено", value: data.overdue, color: "#ef4444", dot: "bg-red-500" },
  ];

  let cumulative = 0;
  const arcs = segments.map((segment) => {
    const fraction = segment.value / totalForRing;
    const dashArray = `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    const dashOffset = -cumulative * CIRCUMFERENCE;
    cumulative += fraction;
    return { ...segment, dashArray, dashOffset };
  });

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Выполнение задач</h2>
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {data.completionPercent !== null ? `Процент выполнения — ${data.completionPercent}%` : "Нет задач с датой в периоде"}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg viewBox="0 0 104 104" className="h-32 w-32 -rotate-90">
            <circle cx="52" cy="52" r={RADIUS} fill="none" strokeWidth="12" className="stroke-gray-100 dark:stroke-gray-800" />
            {total > 0 &&
              arcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx="52"
                  cy="52"
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="12"
                  strokeDasharray={arc.dashArray}
                  strokeDashoffset={arc.dashOffset}
                />
              ))}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-semibold text-gray-900 dark:text-gray-50">{total}</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">всего</span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 shrink-0 rounded-full ${segment.dot}`} />
              <span className="text-gray-500 dark:text-gray-400">{segment.label}</span>
              <span className="ml-auto font-medium text-gray-900 dark:text-gray-50">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">По приоритету</p>
        {data.priorityBreakdown.map((item) => {
          const percent = data.totalWithDueDate > 0 ? Math.round((item.count / data.totalWithDueDate) * 100) : 0;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                <span className="text-gray-400 dark:text-gray-500">{item.count}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onOpenTasks}
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        Посмотреть все задачи
        <ArrowRight size={13} />
      </button>
    </section>
  );
}
