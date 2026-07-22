"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTasksStore } from "@/hooks/useTasksStore";

export function TaskEditModal() {
  const { tasks, editingTaskId, cancelEditing, saveTaskEdit } = useTasksStore();
  const task = editingTaskId ? tasks.find((item) => item.id === editingTaskId) : undefined;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [important, setImportant] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(task.date ?? (task.dueLabel === "—" ? "" : task.dueLabel));
    setTime(task.time ?? "");
    setImportant(task.important);
  }, [task]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={cancelEditing}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Редактировать задачу</h3>
          <button
            type="button"
            onClick={cancelEditing}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveTaskEdit(task.id, { title, date, time, important });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">Название</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
          </label>

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500">Дата</span>
              <input
                type="text"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                placeholder="Завтра / 25 июля"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-xs font-medium text-gray-500">Время</span>
              <input
                type="text"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                placeholder="13:30"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={important}
              onChange={(event) => setImportant(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-0"
            />
            <span className="text-sm text-gray-600">Важная задача</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
