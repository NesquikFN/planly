"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { QUICK_FILTERS, REMINDER_CATEGORIES, REPEAT_FILTERS } from "@/lib/reminders-mock-data";
import type { QuickFilterKey, ReminderCategory, ReminderRepeat } from "@/types/reminder";

interface RemindersSidebarPanelProps {
  activeQuickFilter: QuickFilterKey;
  onQuickFilterChange: (filter: QuickFilterKey) => void;
  activeCategory: ReminderCategory | null;
  onCategoryChange: (category: ReminderCategory | null) => void;
  activeRepeat: ReminderRepeat | null;
  onRepeatChange: (repeat: ReminderRepeat | null) => void;
  onNewReminder: () => void;
}

export function RemindersSidebarPanel({
  activeQuickFilter,
  onQuickFilterChange,
  activeCategory,
  onCategoryChange,
  activeRepeat,
  onRepeatChange,
  onNewReminder,
}: RemindersSidebarPanelProps) {
  return (
    <div className="mt-6 space-y-6 border-t border-gray-100 pt-4 dark:border-gray-800">
      <div className="px-1">
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Напоминания
        </p>
        <button
          type="button"
          onClick={onNewReminder}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Новое напоминание
        </button>
      </div>

      <div>
        <div className="space-y-1">
          {QUICK_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeQuickFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => onQuickFilterChange(filter.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <Icon size={16} />
                <span className="flex-1 truncate">{filter.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{filter.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Тип</p>
        <div className="mt-2 space-y-1">
          {REMINDER_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => onCategoryChange(isActive ? null : category.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", calendarColorStyles[category.color].dot)} />
                <span className="flex-1 truncate">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Повторение
        </p>
        <div className="mt-2 space-y-1">
          {REPEAT_FILTERS.map((repeat) => {
            const isActive = activeRepeat === repeat.key;
            return (
              <button
                key={repeat.key}
                type="button"
                onClick={() => onRepeatChange(isActive ? null : repeat.key)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <span className="flex-1 truncate">{repeat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/60">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">На сегодня</p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-50">Выполнено 3 из 8</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-1.5 w-[38%] rounded-full bg-blue-500" />
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">38%</span>
        </div>
      </div>
    </div>
  );
}
