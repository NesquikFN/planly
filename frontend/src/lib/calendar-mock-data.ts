import type { CalendarDefinition } from "@/types/calendar";

// System calendar sections are UI structure, not user events.
export const DEFAULT_CALENDARS: CalendarDefinition[] = [
  { id: "personal", name: "Личные", color: "blue", visible: true },
  { id: "work", name: "Работа", color: "green", visible: true },
  { id: "lab", name: "Лаборатория", color: "purple", visible: true },
  { id: "family", name: "Семья", color: "orange", visible: true },
  { id: "health", name: "Здоровье", color: "pink", visible: true },
];
