import type { Task } from "@/types/task";
import { addDays, getLocalDateKey } from "@/lib/date-utils";

interface MockTaskSeed {
  id: string;
  title: string;
  dueLabel: string;
  priority: Task["priority"];
  important?: boolean;
  /** Day offset from "today", only for tasks that should also appear on the calendar. */
  dayOffset?: number;
  time?: string;
}

const MOCK_TASK_SEEDS: MockTaskSeed[] = [
  { id: "1", title: "Отправить документы бухгалтеру", dueLabel: "Вчера", priority: "overdue", dayOffset: -1 },
  { id: "2", title: "Заказать материал для лаборатории", dueLabel: "20 июля", priority: "overdue" },
  { id: "3", title: "Позвонить поставщику", dueLabel: "10:00", priority: "important", dayOffset: 0, time: "10:00" },
  {
    id: "4",
    title: "Проверить готовность конструкции",
    dueLabel: "13:30",
    priority: "important",
    dayOffset: 0,
    time: "13:30",
  },
  { id: "5", title: "Купить продукты", dueLabel: "Вечером", priority: "important", dayOffset: 0 },
  {
    id: "6",
    title: "Согласовать смету с клиентом",
    dueLabel: "16:00",
    priority: "important",
    dayOffset: 0,
    time: "16:00",
  },
  { id: "7", title: "Подготовиться к лекции", dueLabel: "Завтра", priority: "upcoming", dayOffset: 1 },
  { id: "8", title: "Оплатить аренду", dueLabel: "25 июля", priority: "upcoming" },
  { id: "9", title: "Записаться на приём к врачу", dueLabel: "28 июля", priority: "upcoming" },
  { id: "10", title: "Купить билеты в Тбилиси", dueLabel: "2 августа", priority: "upcoming" },
  { id: "11", title: "Продлить страховку", dueLabel: "5 августа", priority: "upcoming" },
  { id: "12", title: "Изучить новые материалы UBCERA", dueLabel: "—", priority: "none" },
  { id: "13", title: "Разобрать документы за июнь", dueLabel: "—", priority: "none" },
  { id: "14", title: "Обновить прайс лаборатории", dueLabel: "—", priority: "none" },
];

export function createMockTasks(today: Date): Task[] {
  return MOCK_TASK_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    dueLabel: seed.dueLabel,
    priority: seed.priority,
    completed: false,
    important: seed.important ?? false,
    date: seed.dayOffset !== undefined ? getLocalDateKey(addDays(today, seed.dayOffset)) : undefined,
    time: seed.time,
  }));
}
