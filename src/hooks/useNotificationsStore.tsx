"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppNotification } from "@/types/notification";
import type { Task } from "@/types/task";
import type { CalendarEvent } from "@/types/calendar";
import { readStorage, writeStorage } from "@/lib/storage";
import { buildPassiveNotifications, isPassiveNotificationId } from "@/lib/notifications";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useClock } from "@/hooks/useClock";

const NOTIFICATIONS_STORAGE_KEY = "planly:notifications";
const MAX_NOTIFICATIONS = 100;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface NotificationsStoreValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearRead: () => void;
}

const NotificationsContext = createContext<NotificationsStoreValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const tasksStore = useTasksStore();
  const calendarStore = useCalendarStore();
  const { todayKey, now } = useClock();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [ownHydrated, setOwnHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage<AppNotification[] | null>(NOTIFICATIONS_STORAGE_KEY, null);
    if (stored) setNotifications(stored);
    setOwnHydrated(true);
  }, []);

  useEffect(() => {
    if (ownHydrated) writeStorage(NOTIFICATIONS_STORAGE_KEY, notifications);
  }, [notifications, ownHydrated]);

  // Only start reasoning about the data once every upstream store has
  // finished loading its own localStorage — otherwise the mock→stored swap
  // on first load would look like a burst of real completions/deletions.
  const baselineReady = ownHydrated && tasksStore.hydrated && calendarStore.hydrated;

  // --- Passive, condition-based notifications (overdue / today / due-soon /
  // calendar event today) — recomputed on every relevant change; the
  // deterministic id is what prevents duplicates across renders/reloads.
  useEffect(() => {
    if (!baselineReady) return;

    const desired = buildPassiveNotifications(tasksStore.tasks, calendarStore.events, todayKey, nowMinutes);
    const desiredIds = new Set(desired.map((n) => n.id));

    setNotifications((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const additions = desired.filter((n) => !existingIds.has(n.id));
      // Prune passive notifications whose condition no longer applies (task
      // done/deleted/rescheduled out of the window). Event-driven log
      // entries are left untouched.
      const kept = prev.filter((n) => !isPassiveNotificationId(n.id) || desiredIds.has(n.id));

      if (additions.length === 0 && kept.length === prev.length) return prev;
      return [...additions, ...kept];
    });
  }, [baselineReady, tasksStore.tasks, calendarStore.events, todayKey, nowMinutes]);

  // --- Event-driven notifications (completed / rescheduled / deleted),
  // detected by diffing against the previous snapshot. The very first run
  // after baselineReady flips just captures the starting snapshot — no
  // notifications fire for it.
  const prevTasksRef = useRef<Map<string, Task> | null>(null);

  useEffect(() => {
    if (!baselineReady) return;
    const nextTasks = new Map(tasksStore.tasks.map((task) => [task.id, task]));
    const prevTasks = prevTasksRef.current;

    if (prevTasks) {
      const additions: AppNotification[] = [];

      for (const [id, task] of nextTasks) {
        const prevTask = prevTasks.get(id);
        if (!prevTask) continue;

        if (!prevTask.completed && task.completed) {
          additions.push({
            id: generateId(),
            type: "task-completed",
            title: "Задача выполнена",
            message: task.title,
            createdAt: new Date().toISOString(),
            read: false,
            relatedEntityId: task.id,
            relatedEntityType: "task",
          });
        } else if (
          (prevTask.date ?? "") !== (task.date ?? "") ||
          (prevTask.time ?? "") !== (task.time ?? "")
        ) {
          additions.push({
            id: generateId(),
            type: "task-rescheduled",
            title: "Изменена дата задачи",
            message: task.title,
            createdAt: new Date().toISOString(),
            read: false,
            relatedEntityId: task.id,
            relatedEntityType: "task",
          });
        }
      }

      for (const [id, prevTask] of prevTasks) {
        if (!nextTasks.has(id)) {
          additions.push({
            id: generateId(),
            type: "item-deleted",
            title: "Задача удалена",
            message: prevTask.title,
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      }

      if (additions.length > 0) {
        setNotifications((prev) => [...additions, ...prev].slice(0, MAX_NOTIFICATIONS));
      }
    }

    prevTasksRef.current = nextTasks;
  }, [baselineReady, tasksStore.tasks]);

  const prevEventsRef = useRef<Map<string, CalendarEvent> | null>(null);

  useEffect(() => {
    if (!baselineReady) return;
    const nextEvents = new Map(calendarStore.events.map((event) => [event.id, event]));
    const prevEvents = prevEventsRef.current;

    if (prevEvents) {
      const additions: AppNotification[] = [];

      for (const [id, prevEvent] of prevEvents) {
        if (!nextEvents.has(id)) {
          additions.push({
            id: generateId(),
            type: "item-deleted",
            title: "Событие удалено",
            message: prevEvent.title,
            createdAt: new Date().toISOString(),
            read: false,
          });
        }
      }

      if (additions.length > 0) {
        setNotifications((prev) => [...additions, ...prev].slice(0, MAX_NOTIFICATIONS));
      }
    }

    prevEventsRef.current = nextEvents;
  }, [baselineReady, calendarStore.events]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearRead = useCallback(() => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  const value: NotificationsStoreValue = {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    removeNotification,
    clearRead,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotificationsStore(): NotificationsStoreValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotificationsStore must be used within a NotificationsProvider");
  return ctx;
}
