import type { TaskRecurrenceRule } from './task'

// Повторяет CalendarEvent из frontend/src/types/calendar.ts.

export interface EventRecurrence {
  rule: TaskRecurrenceRule
  weekdays: number[]
  /** Включительно; отсутствует — у серии нет даты окончания. */
  until?: string
}

export interface CalendarEvent {
  id: string
  title: string
  /** ISO-дата; у серии это дата первого вхождения (якорь). */
  date: string
  /** 24ч "HH:MM" */
  startTime: string
  /** 24ч "HH:MM" */
  endTime: string
  calendarId: string
  important: boolean
  allDay: boolean
  description?: string
  project?: string
  projectId?: string
  task?: string
  /** Есть только у строки-серии. Вхождения не хранятся отдельными
   * строками — они вычисляются на клиенте при отрисовке. */
  recurrence?: EventRecurrence
  /** ISO-даты, исключённые из вхождений серии. */
  skippedDates?: string[]
  /** Есть только у строки-переопределения: id серии, одно вхождение
   * которой эта строка подменяет. */
  seriesId?: string
}
