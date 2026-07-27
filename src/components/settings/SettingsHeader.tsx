"use client";

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsHeaderProps {
  title: string;
  description: string;
  isDirty: boolean;
  onCancel: () => void;
  onSave: () => void;
  /** Brief loading state while a save is in flight (Profile's save is intentionally async-feeling). */
  isSaving?: boolean;
}

export function SettingsHeader({ title, description, isDirty, onCancel, onSave, isSaving = false }: SettingsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            isDirty ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {isDirty ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          {isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
        </span>

        <button
          type="button"
          onClick={onCancel}
          disabled={!isDirty || isSaving}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Отменить изменения
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
