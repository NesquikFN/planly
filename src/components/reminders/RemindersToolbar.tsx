"use client";

import { ArrowUpDown, LayoutList, ListFilter, MoreHorizontal, Rows3, Search } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { PRIORITY_OPTIONS } from "@/lib/reminders-mock-data";
import type { ReminderSortKey } from "@/lib/reminders";
import { cn } from "@/lib/utils";
import type { ReminderPriority } from "@/types/reminder";

export type RemindersViewMode = "list" | "schedule";

const sortOptions: { key: ReminderSortKey; label: string }[] = [
  { key: "time", label: "По времени" },
  { key: "priority", label: "По приоритету" },
  { key: "created", label: "По дате создания" },
  { key: "title", label: "По названию" },
];

interface RemindersToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  priorityFilter: ReminderPriority | null;
  onPriorityFilterChange: (priority: ReminderPriority | null) => void;
  sortKey: ReminderSortKey;
  onSortKeyChange: (key: ReminderSortKey) => void;
  viewMode: RemindersViewMode;
  onViewModeChange: (mode: RemindersViewMode) => void;
  onMoreSettings: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function RemindersToolbar({
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  sortKey,
  onSortKeyChange,
  viewMode,
  onViewModeChange,
  onMoreSettings,
  searchInputRef,
}: RemindersToolbarProps) {
  const sortLabel = sortOptions.find((option) => option.key === sortKey)?.label ?? "Сортировка";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск напоминаний..."
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu
          trigger={
            <>
              <ListFilter size={15} />
              {priorityFilter ? PRIORITY_OPTIONS.find((option) => option.key === priorityFilter)?.label : "Фильтр"}
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          items={[
            { key: "all", label: "Все приоритеты", active: priorityFilter === null, onSelect: () => onPriorityFilterChange(null) },
            ...PRIORITY_OPTIONS.map((option) => ({
              key: option.key,
              label: option.label,
              active: priorityFilter === option.key,
              onSelect: () => onPriorityFilterChange(option.key),
            })),
          ]}
        />

        <DropdownMenu
          trigger={
            <>
              <ArrowUpDown size={15} />
              {sortLabel}
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          items={sortOptions.map((option) => ({
            key: option.key,
            label: option.label,
            active: sortKey === option.key,
            onSelect: () => onSortKeyChange(option.key),
          }))}
        />

        <div className="flex items-center rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Список"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              viewMode === "list"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <LayoutList size={15} />
            Список
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("schedule")}
            aria-pressed={viewMode === "schedule"}
            aria-label="Расписание"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              viewMode === "schedule"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <Rows3 size={15} />
            Расписание
          </button>
        </div>

        <button
          type="button"
          onClick={onMoreSettings}
          aria-label="Дополнительные настройки"
          className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
    </div>
  );
}
