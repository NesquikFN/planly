"use client";

import { Archive } from "lucide-react";

interface ProjectsArchiveCardProps {
  onOpenArchive: () => void;
}

export function ProjectsArchiveCard({ onOpenArchive }: ProjectsArchiveCardProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Архив</h2>
          <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">
            Завершённые и неактивные проекты
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenArchive}
          className="rounded-xl border border-gray-100 px-3.5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Открыть архив
        </button>
      </div>

      <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-gray-800">
        <Archive size={24} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">Пусто</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">0 проектов в архиве</p>
      </div>
    </section>
  );
}
