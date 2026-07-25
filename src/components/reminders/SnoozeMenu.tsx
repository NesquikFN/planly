"use client";

import { Clock } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { SNOOZE_OPTIONS, type SnoozeOption } from "@/lib/reminders";

interface SnoozeMenuProps {
  onSnooze: (option: SnoozeOption) => void;
  onPickDateTime: () => void;
  triggerClassName?: string;
}

export function SnoozeMenu({ onSnooze, onPickDateTime, triggerClassName }: SnoozeMenuProps) {
  return (
    <DropdownMenu
      trigger={
        <>
          <Clock size={13} />
          Отложить
        </>
      }
      triggerClassName={
        triggerClassName ??
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
      }
      items={[
        ...SNOOZE_OPTIONS.map((option) => ({
          key: option.key,
          label: option.label,
          onSelect: () => onSnooze(option.key),
        })),
        { key: "custom", label: "Выбрать дату и время", onSelect: onPickDateTime },
      ]}
    />
  );
}
