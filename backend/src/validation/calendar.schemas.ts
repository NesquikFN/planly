import { z } from 'zod'
import { dateString, timeString, uuidParam, weekdaysSchema } from './common.schemas'

const recurrence = z.object({
  rule: z.enum(['none', 'daily', 'weekdays', 'weekly', 'custom']),
  weekdays: weekdaysSchema,
  until: dateString.nullish(),
})

const eventFields = {
  title: z.string().trim().min(1, 'Название события не может быть пустым').max(500),
  date: dateString,
  startTime: timeString,
  endTime: timeString,
  calendarId: z.string().trim().min(1).max(100).default('personal'),
  important: z.boolean().default(false),
  allDay: z.boolean().default(false),
  description: z.string().max(5000).nullish(),
  project: z.string().max(200).nullish(),
  projectId: z.string().max(200).nullish(),
  task: z.string().max(500).nullish(),
  recurrence: recurrence.nullish(),
  skippedDates: z.array(dateString).max(500).nullish(),
  seriesId: uuidParam('Некорректный id серии').nullish(),
}

/** Тот же инвариант, что и constraint calendar_events_time_order в
 * схеме: здесь он даёт понятную 400 вместо сырой ошибки Postgres. */
const endAfterStart = (event: { startTime: string; endTime: string }) =>
  event.endTime > event.startTime

const END_AFTER_START_MESSAGE = {
  message: 'Время окончания должно быть позже начала',
  path: ['endTime'],
}

export const createCalendarEventSchema = z
  .object({
    // Как и у задач: событие создаётся оптимистично на клиенте и должно
    // сохранить свой id.
    id: uuidParam('Некорректный id события').optional(),
    ...eventFields,
  })
  .refine(endAfterStart, END_AFTER_START_MESSAGE)

export const updateCalendarEventSchema = z
  .object({
    title: eventFields.title.optional(),
    date: dateString.optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    calendarId: z.string().trim().min(1).max(100).optional(),
    important: z.boolean().optional(),
    allDay: z.boolean().optional(),
    description: z.string().max(5000).nullish(),
    project: z.string().max(200).nullish(),
    projectId: z.string().max(200).nullish(),
    task: z.string().max(500).nullish(),
    recurrence: recurrence.nullish(),
    skippedDates: z.array(dateString).max(500).nullish(),
    seriesId: uuidParam('Некорректный id серии').nullish(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Пустое тело запроса: нечего обновлять',
  })
  // Проверка возможна только когда пришли оба времени: при обновлении
  // одного из них вторая половина инварианта остаётся за check-ограничением
  // в БД.
  .refine(
    (patch) =>
      patch.startTime === undefined || patch.endTime === undefined || endAfterStart(patch as never),
    END_AFTER_START_MESSAGE,
  )

export const calendarEventIdParamSchema = z.object({
  id: uuidParam('Некорректный id события'),
})
