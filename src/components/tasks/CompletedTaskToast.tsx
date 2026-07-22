"use client";

import { useTasksStore } from "@/hooks/useTasksStore";

export function CompletedTaskToast() {
  const { toast, undoComplete } = useTasksStore();

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-28 lg:left-64">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-gray-100 bg-white px-4 py-2.5 text-sm shadow-sm">
        <span className="text-gray-600">Задача выполнена</span>
        <button
          type="button"
          onClick={undoComplete}
          className="font-medium text-blue-600 hover:underline"
        >
          Отменить
        </button>
      </div>
    </div>
  );
}
