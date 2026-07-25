"use client";

import { Archive, CheckCircle2, Clock, Folder, PauseCircle } from "lucide-react";
import { StatCard, type StatTone } from "@/components/dashboard/StatCard";

interface ProjectsStatsRowProps {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  archived: number;
}

export function ProjectsStatsRow({ total, active, completed, onHold, archived }: ProjectsStatsRowProps) {
  const cards: { key: string; label: string; value: number; icon: typeof Clock; tone: StatTone }[] = [
    { key: "total", label: "Всего проектов", value: total, icon: Folder, tone: "blue" },
    { key: "active", label: "В работе", value: active, icon: Clock, tone: "amber" },
    { key: "completed", label: "Завершено", value: completed, icon: CheckCircle2, tone: "green" },
    { key: "onHold", label: "Отложено", value: onHold, icon: PauseCircle, tone: "gray" },
    { key: "archived", label: "Архив", value: archived, icon: Archive, tone: "purple" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <StatCard key={card.key} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
      ))}
    </div>
  );
}
