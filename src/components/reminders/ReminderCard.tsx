"use client";

import { CalendarDays, CheckCircle2, FolderKanban, ListChecks, Repeat, StickyNote, Star, MoreVertical } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { SnoozeMenu } from "@/components/reminders/SnoozeMenu";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { categoryDef, PRIORITY_META, REPEAT_OPTIONS } from "@/lib/reminders-mock-data";
import { formatOverdueLabel, formatReminderDateLabel, isOverdue, type SnoozeOption } from "@/lib/reminders";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types/reminder";

interface ReminderCardProps {
  reminder: Reminder;
  now: Date;
  today: Date;
  compact?: boolean;
  onToggleComplete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onSnooze: (id: string, option: SnoozeOption) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export function ReminderCard({
  reminder,
  now,
  today,
  compact,
  onToggleComplete,
  onToggleStar,
  onSnooze,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const category = categoryDef(reminder.category);
  const styles = calendarColorStyles[category.color];
  const Icon = category.icon;
  const overdue = isOverdue(reminder, now);
  const overdueLabel = formatOverdueLabel(reminder, now);
  const dateLabel = formatReminderDateLabel(reminder, today);
  const priority = PRIORITY_META[reminder.priority];
  const repeatLabel = REPEAT_OPTIONS.find((option) => option.key === reminder.repeat)?.label;

  const linkEntry = reminder.links
    ? (Object.entries(reminder.links).find(([, value]) => Boolean(value)) as [string, string] | undefined)
    : undefined;
  const linkIcon = linkEntry?.[0] === "project" ? FolderKanban : linkEntry?.[0] === "task" ? ListChecks : linkEntry?.[0] === "note" ? StickyNote : CalendarDays;
  const LinkIcon = linkIcon;

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-2xl border shadow-sm transition-colors",
        reminder.completed
          ? "border-gray-100 bg-gray-50/60 opacity-70 dark:border-gray-800 dark:bg-gray-900/40"
          : "border-gray-100 bg-white hover:bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/40",
      )}
    >
      <div className={cn("w-1 shrink-0", overdue && !reminder.completed ? "bg-red-500" : styles.swatch)} />

      <div className={cn("flex flex-1 items-start gap-3 p-4", compact && "items-center gap-3 p-3")}>
        <button
          type="button"
          onClick={() => onToggleComplete(reminder.id)}
          aria-pressed={reminder.completed}
          aria-label={reminder.completed ? "Вернуть в активные" : "Отметить выполненным"}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            reminder.completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-gray-300 text-transparent hover:border-blue-400 dark:border-gray-600",
          )}
        >
          <CheckCircle2 size={13} strokeWidth={3} />
        </button>

        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.block)}>
          <Icon size={16} className={styles.text} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "truncate text-sm font-semibold",
                reminder.completed ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-900 dark:text-gray-50",
              )}
            >
              {reminder.title}
            </h3>
          </div>

          {reminder.description && !compact && (
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-400 dark:text-gray-500">{reminder.description}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className={overdue && !reminder.completed ? "font-medium text-red-500" : "text-gray-400 dark:text-gray-500"}>
              {dateLabel}
            </span>
            <span className={cn("font-medium", styles.text)}>{category.label}</span>
            {reminder.repeat !== "none" && (
              <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <Repeat size={11} />
                {repeatLabel}
              </span>
            )}
            {linkEntry && (
              <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <LinkIcon size={11} />
                {linkEntry[1]}
              </span>
            )}
            {reminder.completed && reminder.completedLabel && (
              <span className="text-emerald-600 dark:text-emerald-400">Выполнено: {reminder.completedLabel}</span>
            )}
          </div>

          {overdueLabel && !reminder.completed && (
            <span className="mt-1.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {overdueLabel}
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            {!reminder.completed && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", priority.badge)}>
                {priority.label}
              </span>
            )}
            <button
              type="button"
              onClick={() => onToggleStar(reminder.id)}
              aria-pressed={reminder.starred}
              aria-label={reminder.starred ? "Убрать из избранного" : "Добавить в избранное"}
              className="rounded-lg p-1 text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800"
            >
              <Star size={15} className={reminder.starred ? "fill-amber-400 text-amber-400" : undefined} />
            </button>
            <DropdownMenu
              trigger={<MoreVertical size={15} />}
              triggerClassName="rounded-lg p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-gray-800"
              triggerAriaLabel="Действия с напоминанием"
              items={[
                { key: "edit", label: "Редактировать", onSelect: () => onEdit(reminder) },
                { key: "duplicate", label: "Дублировать", onSelect: () => onEdit(reminder) },
                { key: "delete", label: "Удалить", destructive: true, onSelect: () => onDelete(reminder.id) },
              ]}
            />
          </div>

          {!reminder.completed && reminder.date && (
            <SnoozeMenu onSnooze={(option) => onSnooze(reminder.id, option)} onPickDateTime={() => onEdit(reminder)} />
          )}
        </div>
      </div>
    </div>
  );
}
