"use client";

import { AlertTriangle, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { StatCard, type StatTone } from "@/components/dashboard/StatCard";

interface RemindersStatsRowProps {
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

export function RemindersStatsRow({ today, upcoming, overdue, completed }: RemindersStatsRowProps) {
  const cards: { key: string; label: string; value: number; icon: typeof Clock; tone: StatTone }[] = [
    { key: "today", label: "Сегодня", value: today, icon: CalendarClock, tone: "blue" },
    { key: "upcoming", label: "Предстоящие", value: upcoming, icon: Clock, tone: "purple" },
    { key: "overdue", label: "Просроченные", value: overdue, icon: AlertTriangle, tone: "red" },
    { key: "completed", label: "Выполненные", value: completed, icon: CheckCircle2, tone: "green" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <StatCard key={card.key} label={card.label} value={card.value} icon={card.icon} tone={card.tone} />
      ))}
    </div>
  );
}
