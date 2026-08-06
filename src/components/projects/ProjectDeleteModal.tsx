"use client";

import { AlertTriangle, X } from "lucide-react";
import type { Project } from "@/types/project";

interface ProjectDeleteModalProps {
  project: Project | null;
  onCancel: () => void;
  onConfirm: (project: Project) => void;
}

export function ProjectDeleteModal({ project, onCancel, onConfirm }: ProjectDeleteModalProps) {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:shadow-none dark:border-white/8 dark:bg-surface">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Закрыть"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2"
        >
          <X size={18} />
        </button>

        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
          <AlertTriangle size={20} />
        </div>

        <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-ink">Удалить проект?</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-ink-faint">
          «{project.name}» и все его задачи, заметки, файлы будут удалены без возможности восстановления.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onConfirm(project)}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
