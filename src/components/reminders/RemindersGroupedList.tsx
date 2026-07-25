"use client";

import { ChevronDown, ListChecks } from "lucide-react";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { cn } from "@/lib/utils";
import type { ReminderGroup } from "@/lib/reminders";
import type { SnoozeOption } from "@/lib/reminders";
import type { Reminder } from "@/types/reminder";

interface RemindersGroupedListProps {
  groups: ReminderGroup[];
  now: Date;
  today: Date;
  collapsedKeys: Set<string>;
  onToggleCollapse: (key: string) => void;
  onToggleComplete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onSnooze: (id: string, option: SnoozeOption) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export function RemindersGroupedList({
  groups,
  now,
  today,
  collapsedKeys,
  onToggleCollapse,
  onToggleComplete,
  onToggleStar,
  onSnooze,
  onEdit,
  onDelete,
}: RemindersGroupedListProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <ListChecks size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Ничего не найдено</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Попробуйте изменить фильтры или запрос поиска</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const collapsed = collapsedKeys.has(group.key);
        return (
          <section key={group.key}>
            <button
              type="button"
              onClick={() => onToggleCollapse(group.key)}
              className="flex w-full items-center gap-2 px-1 py-1 text-left"
            >
              <ChevronDown
                size={15}
                className={cn("text-gray-400 transition-transform dark:text-gray-500", collapsed && "-rotate-90")}
              />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{group.label}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{group.reminders.length}</span>
            </button>

            {!collapsed && (
              <div className="mt-2 space-y-2">
                {group.reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    now={now}
                    today={today}
                    onToggleComplete={onToggleComplete}
                    onToggleStar={onToggleStar}
                    onSnooze={onSnooze}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
