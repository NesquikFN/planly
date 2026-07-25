"use client";

import { AlertTriangle, X } from "lucide-react";

interface ArchiveConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ArchiveConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Удалить",
  onCancel,
  onConfirm,
}: ArchiveConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Закрыть"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <X size={18} />
        </button>

        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
          <AlertTriangle size={20} />
        </div>

        <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-gray-50">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
