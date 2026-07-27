"use client";

import { settingsSectionTitle } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { ArchiveCategoryInfo, ArchiveCategorySummary } from "@/lib/archive";
import type { ArchiveEntityType } from "@/types/archive";

interface ArchiveCategoriesProps {
  categories: ArchiveCategoryInfo[];
  summaries: Record<ArchiveEntityType, ArchiveCategorySummary>;
  activeType: ArchiveEntityType | null;
  onSelectType: (type: ArchiveEntityType) => void;
}

export function ArchiveCategories({ categories, summaries, activeType, onSelectType }: ArchiveCategoriesProps) {
  return (
    <section>
      <h3 className={settingsSectionTitle}>Категории</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const summary = summaries[category.key];
          const isActive = activeType === category.key;

          return (
            <button
              key={category.key}
              type="button"
              onClick={() => onSelectType(category.key)}
              aria-pressed={isActive}
              className={cn(
                "rounded-2xl border bg-white p-4 text-left shadow-sm transition-colors dark:bg-gray-900",
                isActive ? "border-blue-300 dark:border-blue-500/60" : "border-gray-100 dark:border-gray-800",
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                  )}
                >
                  <Icon size={16} />
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{summary.sizeLabel}</span>
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{category.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{summary.count} элементов</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
