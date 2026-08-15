"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List, ListFilter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { BUTTON_PRIMARY } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

export type NotesViewMode = "list" | "grid";

const filterLabels = ["Все", "С вложениями", "С задачами", "Без тегов"] as const;
const sortLabels = ["По дате изменения", "По названию", "По дате создания", "По избранному"] as const;

interface NotesToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterLabel: string;
  onFilterLabelChange: (label: string) => void;
  sortLabel: string;
  onSortLabelChange: (label: string) => void;
  viewMode: NotesViewMode;
  onViewModeChange: (mode: NotesViewMode) => void;
  onNewNote: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function NotesToolbar({
  searchQuery,
  onSearchChange,
  filterLabel,
  onFilterLabelChange,
  sortLabel,
  onSortLabelChange,
  viewMode,
  onViewModeChange,
  onNewNote,
  searchInputRef,
}: NotesToolbarProps) {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (inputValue !== searchQuery) onSearchChange(inputValue);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [inputValue, onSearchChange, searchQuery]);

  function clearSearch() {
    setInputValue("");
    onSearchChange("");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-ink-faint"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Поиск заметок..."
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-10 text-sm text-gray-700 shadow-sm dark:shadow-none transition-colors placeholder:text-gray-400 focus:border-gray-300 focus:outline-none dark:border-white/8 dark:bg-surface dark:text-ink-dim dark:placeholder:text-ink-faint dark:focus:border-white/20"
        />
        {inputValue && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Очистить поиск"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu
          trigger={
            <>
              <ListFilter size={15} />
              Фильтр
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm dark:shadow-none transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-white/8 dark:bg-surface dark:text-ink-faint dark:hover:bg-surface-2"
          items={filterLabels.map((label) => ({
            key: label,
            label,
            active: filterLabel === label,
            onSelect: () => onFilterLabelChange(label),
          }))}
        />

        <DropdownMenu
          trigger={
            <>
              <SlidersHorizontal size={15} />
              Сортировка
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm dark:shadow-none transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:border-white/8 dark:bg-surface dark:text-ink-faint dark:hover:bg-surface-2"
          items={sortLabels.map((label) => ({
            key: label,
            label,
            active: sortLabel === label,
            onSelect: () => onSortLabelChange(label),
          }))}
        />

        <div className="flex items-center rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:shadow-none dark:border-white/8 dark:bg-surface">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Сетка"
            className={cn(
              "rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              viewMode === "grid"
                ? "bg-gray-100 text-gray-900 dark:bg-surface-2 dark:text-ink"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2",
            )}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Список"
            className={cn(
              "rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
              viewMode === "list"
                ? "bg-gray-100 text-gray-900 dark:bg-surface-2 dark:text-ink"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-2",
            )}
          >
            <List size={17} />
          </button>
        </div>

        <button type="button" onClick={onNewNote} className={cn(BUTTON_PRIMARY, "shrink-0 px-4 py-2.5")}>
          <Plus size={16} />
          Новая заметка
        </button>
      </div>
    </div>
  );
}
