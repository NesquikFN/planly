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
      <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-50">Архив</h2>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
        Задачи, проекты, заметки, файлы, события и напоминания, отправленные в архив
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Всего элементов" value={totalItems} icon={ArchiveIcon} tone="blue" />
        <StatCard label="Категорий с данными" value={categoriesWithItems} icon={Layers} tone="purple" />
        <StatCard label="Заархивировано за месяц" value={archivedThisMonth} icon={CalendarClock} tone="green" />
      </div>
    </section>
  );
}
