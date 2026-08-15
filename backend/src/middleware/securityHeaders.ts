import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'

/**
 * Заголовки безопасности. Сознательно вручную, а не через helmet: набор
 * маленький и явный список читается легче, чем конфигурация с
 * отключёнными по умолчанию пунктами.
 *
 * Это чистый API-сервис, отдающий только JSON, поэтому
 * X-Frame-Options: DENY здесь безопасен — фреймить JSON-ответы незачем.
 * Сами страницы отдаёт frontend-сервис (Next.js), и его заголовки
 * настраиваются отдельно, в next.config.mjs.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Только в production: на локальном http HSTS всё равно игнорируется, а
  // вот закрепить https для localhost в браузере разработчика — реальное
  // неудобство, которое потом трудно отменить.
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

/** Приватные ответы API не должны оседать в промежуточных кешах. */
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store')
  next()
}
