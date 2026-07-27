"use client";

import { Download, RotateCcw, Trash2 } from "lucide-react";
import { settingsCard } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";

interface ArchiveBulkActionsBarProps {
  selectedCount: number;
  onRestoreSelected: () => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
}

export function ArchiveBulkActionsBar({
  selectedCount,
  onRestoreSelected,
  onExportSelected,
  onDeleteSelected,
}: ArchiveBulkActionsBarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <section className={cn(settingsCard, "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {hasSelection ? `Выбрано элементов: ${selectedCount}` : "Массовые действия — выберите элементы в таблице"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRestoreSelected}
          disabled={!hasSelection}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RotateCcw size={14} />
          Восстановить
        </button>
        <button
          type="button"
          onClick={onExportSelected}
          disabled={!hasSelection}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Download size={14} />
          Экспортировать
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelection}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <Trash2 size={14} />
          Удалить
        </button>
      </div>
    </section>
  );
}
