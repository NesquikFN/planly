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
  const nextGoal = data.goals[0];

  const quickActions = [
    { key: "tasks", label: "Открыть задачи", icon: ClipboardList, onClick: onOpenTasks },
    { key: "projects", label: "Посмотреть проекты", icon: FolderKanban, onClick: onOpenProjects },
    { key: "plan", label: "Запланировать неделю", icon: CalendarRange, onClick: onPlanWeek },
    { key: "export", label: "Экспортировать отчёт", icon: Download, onClick: onExport },
  ];

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Сегодня</h3>
        <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-50">
          {data.today.completed} из {data.today.total}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">задач выполнено</p>
        <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            <span>Фокус-время</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">{data.today.focusLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Результат дня</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">{data.today.scorePercent}%</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-1.5">
          <Trophy size={14} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Лучший день</h3>
        </div>
        <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-50">{data.bestDay.label}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Результат {data.bestDay.score} · выполнено {data.bestDay.tasksDone} задач
        </p>
      </section>

      {nextGoal && (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Следующая цель</h3>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-50">{nextGoal.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${nextGoal.percent}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{nextGoal.percent}%</span>
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{nextGoal.detail}</p>
        </section>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
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
