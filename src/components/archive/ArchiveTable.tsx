"use client";

import { MoreVertical } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { ARCHIVE_TYPE_LABELS, estimateItemBytes, formatByteSize, formatDeletedAtLabel, resolveArchiveIcon } from "@/lib/archive";
import { settingsCard } from "@/lib/settings-form-styles";
import { cn } from "@/lib/utils";
import type { ArchiveItem, ArchiveReason } from "@/types/archive";

const checkboxClass = "h-4 w-4 shrink-0 rounded border-gray-300 accent-accent focus:ring-0 dark:border-white/8 dark:bg-surface-2";

// Neutral, non-alarming states — "completed" and "deleted" both just describe
// how the item got here, neither is a warning. Records without a reason
// (written before this field existed) fall back to a plain "В архиве" badge.
const REASON_BADGE: Record<ArchiveReason | "unknown", { label: string; className: string }> = {
  completed: {
    label: "Выполнена",
    className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  deleted: {
    label: "Удалена",
    className: "bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint",
  },
  unknown: {
    label: "В архиве",
    className: "bg-gray-100 text-gray-400 dark:bg-surface-2 dark:text-ink-faint",
  },
};

function ReasonBadge({ reason }: { reason?: ArchiveReason }) {
  const { label, className } = REASON_BADGE[reason ?? "unknown"];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

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
      <div className={cn(settingsCard, "text-center text-sm text-gray-400 dark:text-ink-faint")}>
        Ничего не найдено по текущим фильтрам
      </div>
    );
  }

  return (
    <div className={cn(settingsCard, "overflow-x-auto p-0")}>
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 dark:border-white/8 dark:text-ink-faint">
            <th className="w-10 px-4 py-3">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Выбрать всё" className={checkboxClass} />
            </th>
            <th className="px-2 py-3 font-medium">Название</th>
            <th className="px-2 py-3 font-medium">Тип</th>
            <th className="px-2 py-3 font-medium">Результат</th>
            <th className="px-2 py-3 font-medium">Источник</th>
            <th className="px-2 py-3 font-medium">Дата удаления</th>
            <th className="px-2 py-3 font-medium">Размер</th>
            <th className="w-10 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/8">
          {items.map((item) => {
            const Icon = resolveArchiveIcon(item);
            const isSelected = selectedIds.has(item.id);

            return (
              <tr key={item.id} className={cn(isSelected && "bg-accent/5")}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    aria-label={`Выбрать «${item.title}»`}
                    className={checkboxClass}
                  />
                </td>
                <td className="px-2 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-ink">{item.title}</p>
                      {item.preview && <p className="truncate text-xs text-gray-400 dark:text-ink-faint">{item.preview}</p>}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-ink-faint">{ARCHIVE_TYPE_LABELS[item.entityType]}</td>
                <td className="whitespace-nowrap px-2 py-3">
                  <ReasonBadge reason={item.reason} />
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-ink-faint">{item.sourceModule}</td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-ink-faint">{formatDeletedAtLabel(item.deletedAt)}</td>
                <td className="whitespace-nowrap px-2 py-3 text-gray-500 dark:text-ink-faint">{formatByteSize(estimateItemBytes(item))}</td>
                <td className="px-2 py-3 text-right">
                  <DropdownMenu
                    trigger={<MoreVertical size={16} />}
                    triggerClassName="rounded-lg p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-ink-faint dark:hover:bg-surface-2"
                    triggerAriaLabel="Действия"
                    items={[
                      { key: "restore", label: "Восстановить", onSelect: () => onRestore(item) },
                      { key: "delete", label: "Удалить навсегда", destructive: true, onSelect: () => onDeleteRequest(item) },
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
