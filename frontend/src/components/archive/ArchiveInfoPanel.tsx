"use client";

import { settingsCard, settingsSectionTitle } from "@/lib/settings-form-styles";

interface ArchiveInfoPanelProps {
  totalItems: number;
  totalSizeLabel: string;
  mostRecentLabel: string;
}

export function ArchiveInfoPanel({ totalItems, totalSizeLabel, mostRecentLabel }: ArchiveInfoPanelProps) {
  const rows = [
    { label: "Количество элементов", value: String(totalItems) },
    { label: "Размер архива", value: totalSizeLabel },
    { label: "Последнее удаление", value: mostRecentLabel },
  ];

  return (
    <aside className={settingsCard}>
      <h3 className={settingsSectionTitle}>Информация</h3>

      <div className="mt-2 divide-y divide-gray-100 dark:divide-white/8">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="text-gray-400 dark:text-ink-faint">{row.label}</span>
            <span className="font-medium text-gray-900 dark:text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
