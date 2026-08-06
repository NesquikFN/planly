"use client";

import { CalendarPlus, ClipboardList, FolderPlus, Flag } from "lucide-react";
import { MiniCalendar } from "@/components/calendar/MiniCalendar";
import { useTasksStore } from "@/hooks/useTasksStore";
import { priorityStyles } from "@/lib/priority";

interface ProjectsSidePanelProps {
  onQuickAction: (action: string) => void;
}

export function ProjectsSidePanel({ onQuickAction }: ProjectsSidePanelProps) {
  const { tasks } = useTasksStore();

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.date)
    .sort((a, b) => {
      const dateA = a.date ?? "";
      const dateB = b.date ?? "";
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.time ?? "23:59").localeCompare(b.time ?? "23:59");
    })
    .slice(0, 5);

  const quickActions = [
    { key: "task", label: "Новая задача", icon: ClipboardList },
    { key: "event", label: "Новое событие", icon: CalendarPlus },
    { key: "project", label: "Новый проект", icon: FolderPlus },
  ];

  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:shadow-none sm:p-5 dark:border-white/8 dark:bg-surface">
        <MiniCalendar />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:shadow-none sm:p-5 dark:border-white/8 dark:bg-surface">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Ближайшие задачи</h3>

        {upcomingTasks.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400 dark:text-ink-faint">Нет запланированных задач</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {upcomingTasks.map((task) => {
              const styles = priorityStyles[task.priority];
              return (
                <li key={task.id} className="flex items-start gap-2.5">
                  <Flag size={13} fill="currentColor" className={`mt-1 shrink-0 ${styles.flag}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-ink">{task.title}</p>
                    <p className={`truncate text-xs ${styles.due}`}>{task.dueLabel}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:shadow-none sm:p-5 dark:border-white/8 dark:bg-surface">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Быстрые действия</h3>
        <div className="mt-3 space-y-1.5">
          {quickActions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onQuickAction(label)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
