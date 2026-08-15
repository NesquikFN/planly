import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { env } from './config/env'
import { apiRouter } from './routes'
import { requestLogger } from './middleware/requestLogger'
import { notFoundHandler } from './middleware/notFoundHandler'
import { errorHandler } from './middleware/errorHandler'
import { noStore, securityHeaders } from './middleware/securityHeaders'
import { globalRateLimiter } from './middleware/rateLimit'

export const app = express()

app.disable('x-powered-by')

// Railway терминирует TLS на своём edge-прокси и добавляет ровно один
// хоп X-Forwarded-For. Именно 1, а не `true`: при `true` Express взял бы
// самую левую (клиентскую) запись XFF, и кто угодно мог бы подделать свой
// IP заголовком, обходя лимиты запросов.
app.set('trust proxy', 1)

// credentials: true обязателен — сессия ездит в куке, и без него браузер
// не отправит её кросс-доменно. Origin при этом строго один (FRONTEND_URL),
// потому что с credentials wildcard-origin запрещён спецификацией — и это
// правильно: иначе любой сайт мог бы дёргать API от имени пользователя.
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(cookieParser())
// 2 МБ, а не стандартные 100 КБ: аватар приезжает data-URL'ом в теле
// PATCH /api/me (см. avatarUrl в profile.schemas).
app.use(express.json({ limit: '2mb' }))

app.use(securityHeaders)

if (env.NODE_ENV === 'development') {
  app.use(requestLogger)
}

app.use('/api', globalRateLimiter, noStore, apiRouter)

app.use(notFoundHandler)
app.use(errorHandler)
