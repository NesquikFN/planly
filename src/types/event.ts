export type EventColor = "orange" | "blue" | "emerald";

export interface CalendarEventItem {
  id: string;
  time: string;
  title: string;
  color: EventColor;
}
