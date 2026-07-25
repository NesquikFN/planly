"use client";

import { MoreVertical } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { ARCHIVE_CATEGORIES, ARCHIVE_TYPE_LABELS } from "@/lib/archive-mock-data";
import { formatSizeLabel } from "@/lib/archive";
import { settingsCard } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { ArchiveItem } from "@/types/archive";

const checkboxClass = "h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-0 dark:border-gray-600 dark:bg-gray-800";
const iconByType = Object.fromEntries(ARCHIVE_CATEGORIES.map((category) => [category.key, category.icon])) as Record<
  ArchiveItem["type"],
  (typeof ARCHIVE_CATEGORIES)[number]["icon"]
>;

interface ArchiveTableProps {
  items: ArchiveItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onRestore: (item: ArchiveItem) => void;
  onDeleteRequest: (item: ArchiveItem) => void;
}

export function ArchiveTable({ items, selectedIds, onToggleSelect, onToggleSelectAll, onRestore, onDeleteRequest }: ArchiveTableProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  if (items.length === 0) {
    return (
      <div className={cn(settingsCard, "text-center text-sm text-gray-400 dark:text-gray-500")}>
        Ничего не найдено по текущим фильтрам
      </div>
    );
  }

  return (
    <div className={cn(settingsCard, "overflow-x-auto p-0")}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            <th className="w-10 px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Выбрать всё" className={checkboxClass} />
            </th>
            <th className="px-2 py-3 font-medium">Название</th>
            <th className="px-2 py-3 font-medium">Тип</th>
            <th className="px-2 py-3 font-medium">Дата создания</th>
            <th className="px-2 py-3 font-medium">Дата архивации</th>
            <th className="px-2 py-3 font-medium">Размер</th>
            <th className="px-2 py-3 font-medium">Автор</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => {
            const Icon = iconByType[item.type];
            const isSelected = selectedIds.has(item.id);

            return (
              <tr key={item.id} className={cn(isSelected && "bg-blue-50/40 dark:bg-blue-500/5")}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    aria-label={`Выбрать «${item.name}»`}
                    className={checkboxClass}
                  />
                </td>
                <td className="px-2 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-gray-50">{item.name}</p>
                      {(item.project ?? item.tags.length > 0) && (
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                          {[item.project, item.tags.length > 0 ? item.tags.join(", ") : null].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-gray-400">{ARCHIVE_TYPE_LABELS[item.type]}</td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-gray-400">{item.createdAtLabel}</td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-gray-400">{item.archivedAtLabel}</td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-gray-400">{formatSizeLabel(item.sizeKb)}</td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-gray-400">{item.author}</td>
                <td className="px-2 py-3 text-right">
                  <DropdownMenu
                    trigger={<MoreVertical size={16} />}
                    triggerClassName="rounded-lg p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-gray-800"
                    triggerAriaLabel="Действия"
                    items={[
                      { key: "restore", label: "Восстановить", onSelect: () => onRestore(item) },
                      { key: "delete", label: "Удалить", destructive: true, onSelect: () => onDeleteRequest(item) },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
