import type { Task } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";
import type { AppNotification, NotificationType } from "@/types/notification";
import { timeToMinutes } from "@/lib/calendar-time";

export const DUE_SOON_WINDOW_MINUTES = 120;

// Passive notification ids are deterministic and prefixed by kind, so
// re-scanning on every render/reload never creates a duplicate — the id
// itself is the dedup key.
export const PASSIVE_ID_PREFIXES = ["overdue:", "today:", "due-soon:", "calendar-today:"] as const;

export function isPassiveNotificationId(id: string): boolean {
  return PASSIVE_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

function makeNotification(params: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: "task" | "event";
}): AppNotification {
  return {
    id: params.id,
    type: params.type,
    title: params.title,
    message: params.message,
    createdAt: new Date().toISOString(),
    read: false,
    relatedEntityId: params.relatedEntityId,
    relatedEntityType: params.relatedEntityType,
  };
}

/** Scans current tasks/events and derives the "should exist right now" set
 * of passive (condition-based) notifications. Callers reconcile this against
 * whatever is already stored — new ones get added, resolved ones get pruned. */
export function buildPassiveNotifications(
  tasks: Task[],
  events: CalendarEvent[],
  todayKey: string,
  nowMinutes: number,
): AppNotification[] {
  const result: AppNotification[] = [];

  for (const task of tasks) {
    if (task.completed || !task.date) continue;

    if (task.date < todayKey) {
      result.push(
        makeNotification({
          id: `overdue:${task.id}`,
          type: "task-overdue",
          title: "Просроченная задача",
          message: task.title,
          relatedEntityId: task.id,
          relatedEntityType: "task",
        }),
      );
      continue;
    }

    if (task.date === todayKey) {
      const minutesUntil = task.time ? timeToMinutes(task.time) - nowMinutes : null;
      const isDueSoon = minutesUntil !== null && minutesUntil >= 0 && minutesUntil <= DUE_SOON_WINDOW_MINUTES;

      if (isDueSoon) {
        result.push(
          makeNotification({
            id: `due-soon:${task.id}:${todayKey}`,
            type: "task-due-soon",
            title: "Скоро дедлайн",
            message: `«${task.title}» — в ${task.time}`,
            relatedEntityId: task.id,
            relatedEntityType: "task",
          }),
        );
      } else {
        result.push(
          makeNotification({
            id: `today:${task.id}:${todayKey}`,
            type: "task-today",
            title: "Задача на сегодня",
            message: task.title,
            relatedEntityId: task.id,
            relatedEntityType: "task",
          }),
        );
      }
    }
  }

  for (const event of events) {
    if (event.date === todayKey) {
      result.push(
        makeNotification({
          id: `calendar-today:${event.id}:${todayKey}`,
          type: "calendar-event-today",
          title: "Событие сегодня",
          message: `${event.title} в ${event.startTime}`,
          relatedEntityId: event.id,
          relatedEntityType: "event",
        }),
      );
    }
  }

  return result;
}
