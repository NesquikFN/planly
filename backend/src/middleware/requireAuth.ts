import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env'
import { toAuthUser, usersRepository } from '../repositories/users.repository'
import { verifySession } from '../services/session.service'
import { AppError } from '../utils/AppError'
import { extractToken } from '../utils/sessionCookie'

/**
 * Единственный источник req.user. Токен только подтверждает, кто это, —
 * сам пользователь каждый раз перечитывается из БД: подпись действует 30
 * дней, и за это время учётная запись может быть удалена.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req)
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Требуется вход в аккаунт')
    }

    const payload = verifySession(token, env.JWT_SECRET)
    const row = await usersRepository.findById(payload.sub)
    if (!row) {
      throw new AppError(401, 'UNAUTHORIZED', 'Пользователь сессии не найден')
    }

    req.user = toAuthUser(row)
    next()
  } catch (error) {
    next(error)
  }
}
