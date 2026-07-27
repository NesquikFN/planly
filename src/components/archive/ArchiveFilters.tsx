"use client";

import type { RefObject } from "react";
import { CalendarRange, ListFilter, Search } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { ARCHIVE_DATE_FILTERS, ARCHIVE_TYPE_LABELS } from "@/lib/archive";
import type { ArchiveDateFilterKey, ArchiveEntityType } from "@/types/archive";

const filterTriggerClass =
  "inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800";

interface ArchiveFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  typeFilter: ArchiveEntityType | null;
  onTypeFilterChange: (type: ArchiveEntityType | null) => void;
  dateFilter: ArchiveDateFilterKey;
  onDateFilterChange: (filter: ArchiveDateFilterKey) => void;
}

export function ArchiveFilters({
  searchQuery,
  onSearchChange,
  searchInputRef,
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
}: ArchiveFiltersProps) {
  const dateLabel = ARCHIVE_DATE_FILTERS.find((option) => option.key === dateFilter)?.label ?? "Всё время";

  return (
    <section className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
          placeholder="Поиск по архиву..."
          className="w-full rounded-2xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu
          trigger={
            <>
              <ListFilter size={15} />
              {typeFilter ? ARCHIVE_TYPE_LABELS[typeFilter] : "Тип"}
            </>
          }
          triggerClassName={filterTriggerClass}
          items={[
            { key: "all", label: "Все типы", active: typeFilter === null, onSelect: () => onTypeFilterChange(null) },
            ...(Object.keys(ARCHIVE_TYPE_LABELS) as ArchiveEntityType[]).map((type) => ({
              key: type,
              label: ARCHIVE_TYPE_LABELS[type],
              active: typeFilter === type,
              onSelect: () => onTypeFilterChange(type),
            })),
          ]}
        />

        <DropdownMenu
          trigger={
            <>
              <CalendarRange size={15} />
              {dateLabel}
            </>
          }
          triggerClassName={filterTriggerClass}
          items={ARCHIVE_DATE_FILTERS.map((option) => ({
            key: option.key,
            label: option.label,
            active: dateFilter === option.key,
            onSelect: () => onDateFilterChange(option.key),
          }))}
        />
      </div>
    </section>
  );
}
