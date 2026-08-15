import { Router } from 'express'
import * as calendarEventsController from '../controllers/calendar-events.controller'

export const calendarEventsRouter = Router()

calendarEventsRouter.get('/', calendarEventsController.listEvents)
calendarEventsRouter.post('/', calendarEventsController.createEvent)
calendarEventsRouter.patch('/:id', calendarEventsController.updateEvent)
calendarEventsRouter.delete('/:id', calendarEventsController.deleteEvent)
