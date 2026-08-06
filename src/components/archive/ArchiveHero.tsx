"use client";

import { Archive as ArchiveIcon, CalendarClock, Layers } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

interface ArchiveHeroProps {
  totalItems: number;
  categoriesWithItems: number;
  archivedThisMonth: number;
}

export function ArchiveHero({ totalItems, categoriesWithItems, archivedThisMonth }: ArchiveHeroProps) {
  return (
    <section>
      <p className="text-sm text-gray-400 dark:text-ink-faint">
        Задачи, заметки, проекты и напоминания, удалённые из своих разделов — их можно найти и восстановить здесь
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Всего элементов" value={totalItems} icon={ArchiveIcon} tone="blue" />
        <StatCard label="Категорий с данными" value={categoriesWithItems} icon={Layers} tone="purple" />
        <StatCard label="Заархивировано за месяц" value={archivedThisMonth} icon={CalendarClock} tone="green" />
      </div>
    </section>
  );
}
