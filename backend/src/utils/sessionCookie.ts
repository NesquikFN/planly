import type { Request, Response } from 'express'
import { env, isCrossSiteSetup } from '../config/env'
import { SESSION_TTL_SECONDS } from '../services/session.service'

/**
 * Сессия живёт в httpOnly-куке, а не в localStorage: так токен
 * недоступен из JavaScript (XSS не может его прочитать), и — что важнее
 * для Next.js — его видит proxy.ts на сервере, поэтому неавторизованный
 * пользователь получает редирект ещё до рендера страницы, а не после.
 *
 * На Railway фронт и бэк живут на разных доменах, поэтому в production
 * кука обязана быть SameSite=None; Secure — иначе браузер не отправит её
 * с fetch'ем фронтенда (см. isCrossSiteSetup).
 */
function cookieOptions() {
  return {
    httpOnly: true,
    secure: isCrossSiteSetup,
    sameSite: isCrossSiteSetup ? ('none' as const) : ('lax' as const),
    path: '/',
    ...(env.SESSION_COOKIE_DOMAIN ? { domain: env.SESSION_COOKIE_DOMAIN } : {}),
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: SESSION_TTL_SECONDS * 1000,
  })
}

export function clearSessionCookie(res: Response): void {
  // Те же атрибуты, что при установке: браузер сопоставляет куку по
  // имени + domain + path, и без них удаление молча не сработает.
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions())
}

/**
 * Кука — основной способ, Bearer — запасной: с ним удобно дёргать API из
 * curl или из тестов, не собирая cookie jar.
 */
export function extractToken(req: Request): string | null {
  const fromCookie = req.cookies?.[env.SESSION_COOKIE_NAME]
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie

  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}
