"use client";

import { CalendarRange, ClipboardList, Download, FolderKanban, Trophy } from "lucide-react";
import type { AnalyticsData } from "@/types/analytics";

interface AnalyticsSidePanelProps {
  data: AnalyticsData;
  onOpenTasks: () => void;
  onOpenProjects: () => void;
  onPlanWeek: () => void;
  onExport: () => void;
}

export function AnalyticsSidePanel({ data, onOpenTasks, onOpenProjects, onPlanWeek, onExport }: AnalyticsSidePanelProps) {
  const quickActions = [
    { key: "tasks", label: "Открыть задачи", icon: ClipboardList, onClick: onOpenTasks },
    { key: "projects", label: "Посмотреть проекты", icon: FolderKanban, onClick: onOpenProjects },
    { key: "plan", label: "Запланировать неделю", icon: CalendarRange, onClick: onPlanWeek },
    { key: "export", label: "Экспортировать отчёт", icon: Download, onClick: onExport },
  ];

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Сегодня</h3>
        <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-ink">
          {data.today.completed} из {data.today.total}
        </p>
        <p className="text-xs text-gray-400 dark:text-ink-faint">задач с сегодняшней датой выполнено</p>
        <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-ink-faint">
          <div className="flex items-center justify-between">
            <span>События сегодня</span>
            <span className="font-medium text-gray-900 dark:text-ink">{data.today.eventsLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Результат дня</span>
            <span className="font-medium text-gray-900 dark:text-ink">
              {data.today.scorePercent !== null ? `${data.today.scorePercent}%` : "—"}
            </span>
          </div>
        </div>
      </section>

      {data.bestDay && (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Лучший день периода</h3>
          </div>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-ink">{data.bestDay.label}</p>
          <p className="text-xs text-gray-400 dark:text-ink-faint">Выполнено {data.bestDay.tasksDone} задач</p>
        </section>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
