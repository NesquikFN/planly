import type { Request, Response } from 'express'
import * as calendarEventsService from '../services/calendar-events.service'
import {
  calendarEventIdParamSchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '../validation/calendar.schemas'
import type { CalendarEventPatch } from '../repositories/calendar-events.repository'

export async function listEvents(req: Request, res: Response): Promise<void> {
  res.json({ events: await calendarEventsService.listEvents(req.user.id) })
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const input = createCalendarEventSchema.parse(req.body)
  res.status(201).json({ event: await calendarEventsService.createEvent(req.user.id, input) })
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const { id } = calendarEventIdParamSchema.parse(req.params)
  const patch = updateCalendarEventSchema.parse(req.body) as CalendarEventPatch
  res.json({ event: await calendarEventsService.updateEvent(req.user.id, id, patch) })
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const { id } = calendarEventIdParamSchema.parse(req.params)
  await calendarEventsService.deleteEvent(req.user.id, id)
  res.status(204).end()
}
