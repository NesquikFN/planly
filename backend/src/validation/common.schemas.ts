import { z } from 'zod'

export const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Единый валидатор идентификаторов. Важно, что он стоит ДО обращения к
 * Postgres: колонки id имеют тип uuid, и любая не-UUID строка («», «abc»,
 * «../../etc/passwd») иначе долетала бы до драйвера и падала ошибкой
 * 22P02, которую errorHandler показал бы как 500.
 */
export function uuidParam(message: string) {
  return z.string().regex(UUID_SHAPE, message)
}

/** ISO-дата "YYYY-MM-DD" — ровно тот формат, в котором даты живут в
 * приложении и в колонках типа date. */
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ожидается дата в формате YYYY-MM-DD')

/** Время "HH:MM" в 24-часовом формате. */
export const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ожидается время в формате HH:MM')

/** Дни недели с понедельника: 0=Пн .. 6=Вс. */
export const weekdaysSchema = z.array(z.number().int().min(0).max(6)).max(7)
