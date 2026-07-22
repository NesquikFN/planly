import type { Task } from "@/types/task";
import type { CalendarEventItem } from "@/types/event";
import type { WeeklyProgress } from "@/types/focus";

export const mockTasks: Task[] = [
  { id: "1", title: "Отправить документы бухгалтеру", dueLabel: "Вчера", priority: "overdue", completed: false, important: false },
  { id: "2", title: "Заказать материал для лаборатории", dueLabel: "20 июля", priority: "overdue", completed: false, important: false },
  { id: "3", title: "Позвонить поставщику", dueLabel: "10:00", priority: "important", completed: false, important: false },
  { id: "4", title: "Проверить готовность конструкции", dueLabel: "13:30", priority: "important", completed: false, important: false },
  { id: "5", title: "Купить продукты", dueLabel: "Вечером", priority: "important", completed: false, important: false },
  { id: "6", title: "Согласовать смету с клиентом", dueLabel: "16:00", priority: "important", completed: false, important: false },
  { id: "7", title: "Подготовиться к лекции", dueLabel: "Завтра", priority: "upcoming", completed: false, important: false },
  { id: "8", title: "Оплатить аренду", dueLabel: "25 июля", priority: "upcoming", completed: false, important: false },
  { id: "9", title: "Записаться на приём к врачу", dueLabel: "28 июля", priority: "upcoming", completed: false, important: false },
  { id: "10", title: "Купить билеты в Тбилиси", dueLabel: "2 августа", priority: "upcoming", completed: false, important: false },
  { id: "11", title: "Продлить страховку", dueLabel: "5 августа", priority: "upcoming", completed: false, important: false },
  { id: "12", title: "Изучить новые материалы UBCERA", dueLabel: "—", priority: "none", completed: false, important: false },
  { id: "13", title: "Разобрать документы за июнь", dueLabel: "—", priority: "none", completed: false, important: false },
  { id: "14", title: "Обновить прайс лаборатории", dueLabel: "—", priority: "none", completed: false, important: false },
];

export const todayEvents: CalendarEventItem[] = [
  { id: "1", time: "10:00", title: "Позвонить поставщику", color: "orange" },
  { id: "2", time: "15:00", title: "Пациент: Иванов И.И.", color: "blue" },
  { id: "3", time: "17:30", title: "Встреча с поставщиком", color: "emerald" },
];

export const defaultFocusTaskId = "4";

export const weeklyProgress: WeeklyProgress = {
  points: [14, 22, 18, 30, 26, 38, 34],
  days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  completed: 12,
  total: 28,
  percent: 43,
};
