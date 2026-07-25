"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { useTasksStore } from "@/hooks/useTasksStore";

export function BottomInput() {
  const [value, setValue] = useState("");
  const { addTaskFromText } = useTasksStore();

  function handleSubmit() {
    if (!value.trim()) return;
    addTaskFromText(value);
    setValue("");
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 sm:px-6 sm:pb-6 lg:left-64 lg:px-8">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <Sparkles size={18} className="shrink-0 text-gray-300 dark:text-gray-600" />
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Напишите цель или мысль, а я превращу её в задачу..."
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder:text-gray-500"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Отправить"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
