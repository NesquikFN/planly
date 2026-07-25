"use client";

import { AlertTriangle, CheckCircle2, Clock, Folder, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { ProjectsOverviewStats } from "@/lib/projects";

export function ProjectsStatsRow({ total, active, completed, overdue, avgProgress }: ProjectsOverviewStats) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Всего проектов" value={total} icon={Folder} tone="blue" />
      <StatCard label="Активные" value={active} icon={Clock} tone="amber" />
      <StatCard label="Завершённые" value={completed} icon={CheckCircle2} tone="green" />
      <StatCard label="Просроченные" value={overdue} icon={AlertTriangle} tone="red" />

      <div className="flex w-full items-start justify-between rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div>
          <p className="text-sm font-medium text-violet-600">Средний прогресс</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-50">{avgProgress}%</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10">
          <TrendingUp size={18} className="text-violet-600 dark:text-violet-400" />
        </div>
      </div>
    </div>
  );
}
