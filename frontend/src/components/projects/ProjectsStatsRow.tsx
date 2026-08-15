"use client";

import { AlertTriangle, CheckCircle2, Clock, Folder, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { ProjectSummaryFilter, ProjectsOverviewStats } from "@/lib/projects";

interface ProjectsStatsRowProps extends ProjectsOverviewStats {
  activeFilter: ProjectSummaryFilter;
  onToggleFilter: (filter: ProjectSummaryFilter) => void;
}

export function ProjectsStatsRow({
  total,
  active,
  completed,
  overdue,
  avgProgress,
  activeFilter,
  onToggleFilter,
}: ProjectsStatsRowProps) {
  const cards = [
    { key: "all", label: "Всего проектов", value: total, valueSuffix: undefined, icon: Folder, tone: "gray" },
    { key: "active", label: "Активные", value: active, valueSuffix: undefined, icon: Clock, tone: "amber" },
    { key: "completed", label: "Завершённые", value: completed, valueSuffix: undefined, icon: CheckCircle2, tone: "green" },
    { key: "overdue", label: "Просроченные", value: overdue, valueSuffix: undefined, icon: AlertTriangle, tone: "red" },
    { key: "inProgress", label: "Средний прогресс", value: avgProgress, valueSuffix: "%", icon: TrendingUp, tone: "purple" },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.value}
          valueSuffix={card.valueSuffix}
          icon={card.icon}
          tone={card.tone}
          active={activeFilter === card.key}
          onClick={() => onToggleFilter(card.key)}
          interactive
        />
      ))}
    </div>
  );
}
