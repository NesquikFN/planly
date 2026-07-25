"use client";

import { ArrowUpDown, LayoutGrid, List, Plus, Search } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

export type ProjectsViewMode = "grid" | "list";

const sortLabels = ["По названию", "По прогрессу", "По сроку", "По задачам"] as const;

interface ProjectsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode: ProjectsViewMode;
  onViewModeChange: (mode: ProjectsViewMode) => void;
  sortLabel: string;
  onSortLabelChange: (label: string) => void;
  onNewProject: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ProjectsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortLabel,
  onSortLabelChange,
  onNewProject,
  searchInputRef,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Поиск проектов..."
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu
          trigger={
            <>
              <ArrowUpDown size={15} />
              {sortLabel}
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          items={sortLabels.map((label) => ({
            key: label,
            label,
            active: sortLabel === label,
            onSelect: () => onSortLabelChange(label),
          }))}
        />

        <div className="flex items-center rounded-xl border border-gray-100 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Сетка"
            className={cn(
              "rounded-lg p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
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
              "rounded-lg p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <List size={17} />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Новый проект
        </button>
      </div>
    </div>
  );
}
