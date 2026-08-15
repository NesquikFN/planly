import { createHmac, timingSafeEqual } from 'node:crypto'
import { AppError } from '../utils/AppError'

/**
 * Минимальный подписанный токен сессии с сроком жизни — функционально
 * это JWT (HMAC-подпись + exp), но без библиотеки ради полезной нагрузки
 * из двух полей. Формат: base64url(payload).base64url(hmac-sha256(payload)).
 *
 * Токен самодостаточен: в БД сессии не хранятся. Плата за это —
 * невозможность отозвать конкретный токен до истечения срока; смена
 * JWT_SECRET разлогинивает сразу всех. Для планировщика это приемлемо, а
 * таблицы сессий и её чистки — нет.
 */

export interface SessionPayload {
  sub: string
  email: string
  iat: number
  exp: number
}

const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60

export const SESSION_TTL_SECONDS = DEFAULT_TTL_SECONDS

export function signSession(
  payload: Pick<SessionPayload, 'sub' | 'email'>,
  secret: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string {
  const iat = Math.floor(Date.now() / 1000)
  const full: SessionPayload = { ...payload, iat, exp: iat + ttlSeconds }
  const body = base64UrlEncode(JSON.stringify(full))
  const signature = sign(body, secret)
  return `${body}.${signature}`
}

export function verifySession(token: string, secret: string): SessionPayload {
  const parts = token.split('.')
  if (parts.length !== 2) {
    throw new AppError(401, 'INVALID_SESSION', 'Недействительная сессия')
  }
  const [body, signature] = parts

  const expectedSignature = sign(body, secret)
  if (!signaturesMatch(signature, expectedSignature)) {
    throw new AppError(401, 'INVALID_SESSION', 'Недействительная сессия')
  }

  let payload: SessionPayload
  try {
    payload = JSON.parse(base64UrlDecode(body)) as SessionPayload
  } catch {
    throw new AppError(401, 'INVALID_SESSION', 'Недействительная сессия')
  }

  if (
    typeof payload.sub !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    throw new AppError(401, 'INVALID_SESSION', 'Недействительная сессия')
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Сессия истекла, войдите ещё раз')
  }

  return payload
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url')
}

function signaturesMatch(received: string, expected: string): boolean {
  const receivedBuf = Buffer.from(received, 'base64url')
  const expectedBuf = Buffer.from(expected, 'base64url')
  if (receivedBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(receivedBuf, expectedBuf)
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}
