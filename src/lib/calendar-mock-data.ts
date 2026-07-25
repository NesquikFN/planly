import type { CalendarDefinition, CalendarEvent } from "@/types/calendar";
import { addDays, startOfWeek, toISODate } from "@/lib/date-utils";

export const mockCalendars: CalendarDefinition[] = [
  { id: "personal", name: "Личные", color: "blue", visible: true },
  { id: "work", name: "Работа", color: "green", visible: true },
  { id: "lab", name: "Лаборатория", color: "purple", visible: true },
  { id: "family", name: "Семья", color: "orange", visible: true },
  { id: "health", name: "Здоровье", color: "pink", visible: true },
];

interface MockEventSeed {
  id: string;
  title: string;
  dayOffset: number; // offset in days from the Monday of "today"'s week
  startTime: string;
  endTime: string;
  calendarId: string;
  important?: boolean;
  project?: string;
  task?: string;
  description?: string;
}

const MOCK_EVENT_SEEDS: MockEventSeed[] = [
  {
    id: "1",
    title: "Подготовиться к лекции",
    dayOffset: 0,
    startTime: "09:00",
    endTime: "11:00",
    calendarId: "lab",
    project: "Лаборатория",
    description: "Подготовить материалы и презентацию по теме новых имплантационных систем.",
  },
  { id: "2", title: "Работа с проектом", dayOffset: 0, startTime: "11:30", endTime: "13:00", calendarId: "work", project: "Работа" },
  { id: "3", title: "Встреча с клиентом", dayOffset: 0, startTime: "13:30", endTime: "14:30", calendarId: "personal", important: true },
  { id: "4", title: "Лаборатория", dayOffset: 0, startTime: "15:00", endTime: "17:00", calendarId: "lab", project: "Лаборатория" },
  { id: "5", title: "Планирование дня", dayOffset: 1, startTime: "08:30", endTime: "09:30", calendarId: "family" },
  { id: "6", title: "Звонок команде", dayOffset: 1, startTime: "10:00", endTime: "11:00", calendarId: "work", project: "Работа" },
  { id: "7", title: "Работа с документами", dayOffset: 1, startTime: "14:00", endTime: "15:30", calendarId: "work", project: "Работа" },
  { id: "8", title: "Тренировка", dayOffset: 1, startTime: "18:00", endTime: "19:00", calendarId: "health", project: "Здоровье" },
  { id: "9", title: "Подготовиться к лекции", dayOffset: 2, startTime: "09:00", endTime: "11:00", calendarId: "lab", project: "Лаборатория" },
  { id: "10", title: "Обед с семьёй", dayOffset: 2, startTime: "12:00", endTime: "13:00", calendarId: "family", project: "Семья" },
  { id: "11", title: "Презентация проекта", dayOffset: 3, startTime: "09:30", endTime: "11:00", calendarId: "work", project: "Работа", important: true },
  { id: "12", title: "Встреча с партнёрами", dayOffset: 3, startTime: "13:30", endTime: "14:30", calendarId: "personal" },
  { id: "13", title: "Работа с проектом", dayOffset: 3, startTime: "16:00", endTime: "17:30", calendarId: "lab", project: "Лаборатория" },
  { id: "14", title: "Планирование недели", dayOffset: 4, startTime: "08:30", endTime: "09:30", calendarId: "family" },
  { id: "15", title: "Отчёты", dayOffset: 4, startTime: "11:00", endTime: "12:30", calendarId: "work", project: "Работа", task: "Сдать квартальный отчёт" },
  { id: "16", title: "Лаборатория", dayOffset: 4, startTime: "15:30", endTime: "17:00", calendarId: "lab", project: "Лаборатория" },
  { id: "17", title: "Время с семьёй", dayOffset: 5, startTime: "15:00", endTime: "18:00", calendarId: "family", project: "Семья" },
  { id: "18", title: "Тренировка", dayOffset: 5, startTime: "12:00", endTime: "13:00", calendarId: "health", project: "Здоровье" },
  { id: "19", title: "Отдых", dayOffset: 6, startTime: "10:00", endTime: "14:00", calendarId: "health", project: "Здоровье" },

  // Spread across the rest of the month so the Month view isn't empty
  // outside the "current week" cluster above.
  { id: "20", title: "Планёрка", dayOffset: -17, startTime: "09:00", endTime: "09:30", calendarId: "work" },
  { id: "21", title: "Созвон с клиентом", dayOffset: -14, startTime: "11:00", endTime: "11:30", calendarId: "personal" },
  { id: "22", title: "Лаборатория", dayOffset: -13, startTime: "14:00", endTime: "16:00", calendarId: "lab" },
  { id: "23", title: "Тренировка", dayOffset: -11, startTime: "18:00", endTime: "19:00", calendarId: "health" },
  { id: "24", title: "Обед с семьёй", dayOffset: -10, startTime: "13:00", endTime: "14:00", calendarId: "family" },
  { id: "25", title: "Ревью проекта", dayOffset: -9, startTime: "10:00", endTime: "11:00", calendarId: "work" },
  { id: "26", title: "Планирование", dayOffset: -6, startTime: "09:00", endTime: "09:30", calendarId: "family" },
  { id: "27", title: "Лаборатория", dayOffset: -4, startTime: "15:00", endTime: "17:00", calendarId: "lab" },
  { id: "28", title: "Встреча с партнёрами", dayOffset: -2, startTime: "12:00", endTime: "13:00", calendarId: "personal" },
  { id: "29", title: "Созвон команды", dayOffset: 8, startTime: "10:00", endTime: "10:30", calendarId: "work" },
  { id: "30", title: "Лаборатория", dayOffset: 9, startTime: "14:00", endTime: "16:00", calendarId: "lab" },
  { id: "31", title: "Тренировка", dayOffset: 10, startTime: "18:00", endTime: "19:00", calendarId: "health" },
  { id: "32", title: "Обед с семьёй", dayOffset: 12, startTime: "13:00", endTime: "14:00", calendarId: "family" },
  { id: "33", title: "Презентация", dayOffset: 13, startTime: "11:00", endTime: "12:00", calendarId: "work" },
  { id: "34", title: "Лаборатория", dayOffset: 15, startTime: "15:00", endTime: "17:00", calendarId: "lab" },
  { id: "35", title: "Врач", dayOffset: 16, startTime: "09:30", endTime: "10:30", calendarId: "health" },
  { id: "36", title: "Планирование недели", dayOffset: 18, startTime: "09:00", endTime: "09:30", calendarId: "family" },
  { id: "37", title: "Созвон с клиентом", dayOffset: 20, startTime: "11:00", endTime: "11:30", calendarId: "personal" },
  { id: "38", title: "Лаборатория", dayOffset: 22, startTime: "14:00", endTime: "16:00", calendarId: "lab" },
];

export function createMockEvents(today: Date): CalendarEvent[] {
  const monday = startOfWeek(today);
  return MOCK_EVENT_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    date: toISODate(addDays(monday, seed.dayOffset)),
    startTime: seed.startTime,
    endTime: seed.endTime,
    calendarId: seed.calendarId,
    important: seed.important ?? false,
    project: seed.project,
    task: seed.task,
    description: seed.description,
  }));
}
