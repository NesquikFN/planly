"use client";

import { Sparkles, X } from "lucide-react";

interface ComingSoonDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: string;
}

/**
 * Shared stub dialog for actions that are UI-only for now (project CRUD,
 * archive, settings, etc.) — gives real click feedback without pretending
 * the feature is implemented.
 */
export function ComingSoonDialog({ open, onClose, title, message }: ComingSoonDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm dark:border-white/8 dark:bg-surface">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2"
        >
          <X size={18} />
        </button>

        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Sparkles size={20} />
        </div>

        <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-ink">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-ink-faint">
          {message ?? "Эта функция появится в одном из следующих обновлений."}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
