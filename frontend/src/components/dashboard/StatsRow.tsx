"use client";

import { Calendar, Clock, Inbox, Star } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTasksStore } from "@/hooks/useTasksStore";
import type { FilterKey } from "@/lib/filters";

export function StatsRow() {
  const { stats, activeFilter, toggleStatFilter } = useTasksStore();

  const cards: {
    key: FilterKey;
    label: string;
    value: number;
    icon: typeof Clock;
    tone: "red" | "amber" | "blue" | "gray";
  }[] = [
    { key: "overdue", label: "Просроченные", value: stats.overdue, icon: Clock, tone: "red" },
    { key: "today", label: "Важные сегодня", value: stats.important, icon: Star, tone: "amber" },
    { key: "upcoming", label: "Будущие", value: stats.upcoming, icon: Calendar, tone: "blue" },
    { key: "none", label: "Без срока", value: stats.none, icon: Inbox, tone: "gray" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          label={card.label}
          value={card.value}
          icon={card.icon}
          tone={card.tone}
          active={activeFilter === card.key}
          onClick={() => toggleStatFilter(card.key)}
        />
      ))}
    </div>
  );
}
