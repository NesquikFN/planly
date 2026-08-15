import {
  calendarEventsRepository,
  type CalendarEventInput,
  type CalendarEventPatch,
} from '../repositories/calendar-events.repository'
import { AppError } from '../utils/AppError'
import type { CalendarEvent } from '../types/calendar'

export async function listEvents(userId: string): Promise<CalendarEvent[]> {
  return calendarEventsRepository.findAllForUser(userId)
}

export async function createEvent(
  userId: string,
  input: CalendarEventInput,
): Promise<CalendarEvent> {
  if (input.seriesId) {
    await assertOwnedSeries(userId, input.seriesId)
  }
  return calendarEventsRepository.create(userId, input)
}

export async function updateEvent(
  userId: string,
  eventId: string,
  patch: CalendarEventPatch,
): Promise<CalendarEvent> {
  if (typeof patch.seriesId === 'string') {
    await assertOwnedSeries(userId, patch.seriesId)
  }

  const event = await calendarEventsRepository.update(userId, eventId, patch)
  if (!event) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Событие не найдено')
  }
  return event
}

export async function deleteEvent(userId: string, eventId: string): Promise<void> {
  const deleted = await calendarEventsRepository.remove(userId, eventId)
  if (!deleted) {
    throw new AppError(404, 'EVENT_NOT_FOUND', 'Событие не найдено')
  }
}

/**
 * series_id — внешний ключ на эту же таблицу, и сама по себе БД не
 * помешала бы сослаться на чужую серию: FK проверяет существование, а не
 * владельца. Без этой проверки пользователь мог бы прицепить своё
 * переопределение к чужой серии, а её удаление каскадом снесло бы его
 * строку.
 */
async function assertOwnedSeries(userId: string, seriesId: string): Promise<void> {
  if (!(await calendarEventsRepository.existsForUser(userId, seriesId))) {
    throw new AppError(404, 'SERIES_NOT_FOUND', 'Серия событий не найдена')
  }
}
