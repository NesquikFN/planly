"use client";

import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";

interface ArchiveInfoPanelProps {
  totalItems: number;
  totalSizeLabel: string;
  lastCleanupLabel: string;
  freeSpaceLabel: string;
  freeSpaceUsedPercent: number;
}

export function ArchiveInfoPanel({
  totalItems,
  totalSizeLabel,
  lastCleanupLabel,
  freeSpaceLabel,
  freeSpaceUsedPercent,
}: ArchiveInfoPanelProps) {
  const rows = [
    { label: "Количество элементов", value: String(totalItems) },
    { label: "Размер архива", value: totalSizeLabel },
    { label: "Последняя очистка", value: lastCleanupLabel },
  ];

  return (
    <aside className={settingsCard}>
      <h3 className={settingsSectionTitle}>Информация</h3>

      <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="text-gray-400 dark:text-gray-500">{row.label}</span>
            <span className="font-medium text-gray-900 dark:text-gray-50">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Свободное место</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${freeSpaceUsedPercent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{freeSpaceLabel}</p>
      </div>
    </aside>
  );
}
