"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { useNotificationsStore } from "@/hooks/useNotificationsStore";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useClickOutside } from "@/hooks/useClickOutside";
import { fromISODate, isToday, isYesterday, formatShortDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/notification";

const TYPE_DOT: Record<NotificationType, string> = {
  "task-overdue": "bg-red-500",
  "task-today": "bg-amber-500",
  "task-due-soon": "bg-orange-500",
  "calendar-event-today": "bg-blue-500",
  "task-completed": "bg-emerald-500",
  "task-rescheduled": "bg-violet-500",
  "item-deleted": "bg-gray-400",
};

function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (isToday(date)) return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (isYesterday(date)) return "Вчера";
  return formatShortDate(date);
}

export function NotificationsPanel() {
  const { notifications, unreadCount, markRead, markAllRead, removeNotification, clearRead } =
    useNotificationsStore();
  const tasksStore = useTasksStore();
  const calendarStore = useCalendarStore();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside(containerRef, () => setOpen(false), open);

  const hasRead = notifications.some((n) => n.read);

  function handleNotificationClick(notification: AppNotification) {
    markRead(notification.id);

    if (notification.relatedEntityType === "task" && notification.relatedEntityId) {
      const task = tasksStore.tasks.find((t) => t.id === notification.relatedEntityId);
      if (task) tasksStore.startEditing(task.id);
    } else if (notification.relatedEntityType === "event" && notification.relatedEntityId) {
      const event = calendarStore.events.find((e) => e.id === notification.relatedEntityId);
      if (event) {
        calendarStore.goToDayView(fromISODate(event.date));
        router.push("/calendar");
      }
    }

    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Уведомления"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Уведомления</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Отметить все прочитанными
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">Новых уведомлений нет</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <li key={notification.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-3 py-2.5 pr-8 text-left hover:bg-gray-50",
                        !notification.read && "bg-blue-50/40",
                      )}
                    >
                      <span
                        className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", TYPE_DOT[notification.type])}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm",
                            notification.read ? "font-medium text-gray-600" : "font-semibold text-gray-900",
                          )}
                        >
                          {notification.title}
                        </span>
                        <span className="block truncate text-xs text-gray-400">{notification.message}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-gray-300">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      aria-label="Удалить уведомление"
                      className="absolute right-2 top-2.5 rounded p-1 text-gray-300 opacity-0 hover:bg-gray-100 hover:text-gray-500 group-hover:opacity-100"
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasRead && (
            <div className="border-t border-gray-100 p-2">
              <button
                type="button"
                onClick={clearRead}
                className="w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Очистить прочитанные
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
