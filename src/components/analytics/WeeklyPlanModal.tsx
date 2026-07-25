"use client";

import { CheckCircle2, X } from "lucide-react";

interface WeeklyPlanModalProps {
  open: boolean;
  steps: string[];
  onClose: () => void;
}

export function WeeklyPlanModal({ open, steps, onClose }: WeeklyPlanModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">План на следующую неделю</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>
        <ul className="mt-4 space-y-2.5">
          {steps.map((step) => (
            <li key={step} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-500" />
              {step}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
