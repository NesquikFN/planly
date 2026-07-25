export type NotificationType =
  | "task-overdue"
  | "task-today"
  | "task-due-soon"
  | "calendar-event-today"
  | "task-completed"
  | "task-rescheduled"
  | "item-deleted";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** ISO datetime */
  createdAt: string;
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: "task" | "event";
}
