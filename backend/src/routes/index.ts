import { Router } from 'express'
import { healthRouter } from './health.routes'
import { authRouter } from './auth.routes'
import { meRouter } from './me.routes'
import { tasksRouter } from './tasks.routes'
import { calendarEventsRouter } from './calendar-events.routes'
import { requireAuth } from '../middleware/requireAuth'
import { authRateLimiter, perUserRateLimiter } from '../middleware/rateLimit'

export const apiRouter = Router()

/** Аутентифицированный пользователь + его персональный лимит запросов
 * (ключ — users.id, а не IP). */
const authenticated = [requireAuth, perUserRateLimiter]

apiRouter.use('/health', healthRouter)

// Всё под /auth — до аутентификации, поэтому лимит только по IP. Он же
// защищает от перебора паролей.
apiRouter.use('/auth', authRateLimiter, authRouter)

apiRouter.use('/me', ...authenticated, meRouter)
apiRouter.use('/tasks', ...authenticated, tasksRouter)
apiRouter.use('/calendar-events', ...authenticated, calendarEventsRouter)
