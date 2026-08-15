import type { Request, Response, NextFunction } from 'express'
import { rateLimit, ipKeyGenerator, MemoryStore, type Options, type Store } from 'express-rate-limit'
import { AppError } from '../utils/AppError'
import { env } from '../config/env'
import { PostgresRateLimitStore } from './rateLimitStore'

/**
 * Лимиты запросов. Две оси намеренно разделены:
 *
 *  - по IP — грубый антифлуд для неаутентифицированного трафика;
 *  - по users.id — настоящие продуктовые лимиты для уже вошедшего
 *    пользователя. Ключ берётся из сессии, поэтому смена IP не даёт
 *    обойти лимит, а общий NAT не задевает соседей.
 *
 * Все лимиты отдают ошибку в том же формате, что и остальной API (через
 * AppError → errorHandler), и не выставляют RateLimit-* заголовков, чтобы
 * не публиковать саму конфигурацию.
 */

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

export const RATE_LIMITS = {
  /** Грубый антифлуд по IP на весь /api. */
  globalPerIpPerMinute: 600,
  /** Основной лимит аутентифицированного пользователя. */
  perUserPerMinute: 240,
  /** Вход и регистрация — до аутентификации, поэтому только по IP.
   * Заодно это защита от перебора паролей: 20 попыток за 15 минут с
   * одного адреса. */
  authPer15Minutes: 20,
  /** Письма (подтверждение почты, сброс пароля). Каждый запрос — реально
   * отправленное письмо, поэтому лимит жёсткий и переживает рестарт. */
  mailPerHour: 5,
} as const

/** Стабильный ключ: id пользователя для аутентифицированных запросов,
 * иначе IP (через ipKeyGenerator — он нормализует IPv6 в /64-подсеть,
 * чтобы один клиент не получил бесконечно много вёдер). */
function userOrIpKey(req: Request): string {
  const userId = req.user?.id
  if (userId) return `user:${userId}`
  return `ip:${ipKeyGenerator(req.ip ?? '')}`
}

function rejectOverLimit(_req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(429, 'RATE_LIMITED', 'Слишком много запросов. Подождите немного и попробуйте ещё раз.'),
  )
}

/**
 * Хранилище счётчиков для лимитов, которые должны пережить рестарт.
 *
 * Часовые лимиты в MemoryStore были бы фикцией: любой деплой обнулял бы
 * их всем одновременно. Минутный антифлуд и auth сознательно остаются в
 * памяти — окно короткое, рестарт инициирует не клиент, а поход в БД на
 * КАЖДЫЙ запрос к /api стоил бы больше, чем даёт.
 *
 * В тестах store всегда в памяти: тестовый DATABASE_URL указывает в
 * мёртвый порт, а сами лимиты, ключи и middleware при этом те же, что в
 * проде.
 */
function persistentStore(name: string): Store {
  return env.NODE_ENV === 'test' ? new MemoryStore() : new PostgresRateLimitStore(name)
}

function buildLimiter(options: Partial<Options>) {
  return rateLimit({
    standardHeaders: false,
    legacyHeaders: false,
    handler: rejectOverLimit,
    keyGenerator: userOrIpKey,
    ...options,
  })
}

/**
 * Лимитер со счётчиком в Postgres.
 *
 * passOnStoreError: если запрос к rate_limit_hits упал, запрос
 * пропускается без учёта лимита. Альтернатива — 500 на входе из-за
 * недоступной БД, что хуже и бессмысленно: все эти эндпоинты и так сразу
 * после лимитера идут в ту же базу, поэтому настоящий сбой БД остановит
 * запрос следующим шагом, с нормальной ошибкой.
 */
function buildPersistentLimiter(name: string, options: Partial<Options>) {
  return buildLimiter({ ...options, store: persistentStore(name), passOnStoreError: true })
}

/** Весь /api, по IP. Стоит до аутентификации, поэтому ключ всегда IP. */
export const globalRateLimiter = buildLimiter({
  windowMs: MINUTE,
  limit: RATE_LIMITS.globalPerIpPerMinute,
  keyGenerator: (req: Request) => `ip:${ipKeyGenerator(req.ip ?? '')}`,
})

/** Ставится сразу после requireAuth — ключ всегда users.id. */
export const perUserRateLimiter = buildLimiter({
  windowMs: MINUTE,
  limit: RATE_LIMITS.perUserPerMinute,
})

export const authRateLimiter = buildLimiter({
  windowMs: 15 * MINUTE,
  limit: RATE_LIMITS.authPer15Minutes,
  keyGenerator: (req: Request) => `ip:${ipKeyGenerator(req.ip ?? '')}`,
})

export const mailRateLimiter = buildPersistentLimiter('mail', {
  windowMs: HOUR,
  limit: RATE_LIMITS.mailPerHour,
  keyGenerator: (req: Request) => `ip:${ipKeyGenerator(req.ip ?? '')}`,
})
