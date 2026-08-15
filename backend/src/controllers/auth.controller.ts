import type { Request, Response } from 'express'
import { env } from '../config/env'
import * as authService from '../services/auth.service'
import {
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validation/auth.schemas'
import { clearSessionCookie, setSessionCookie } from '../utils/sessionCookie'

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body)
  const { user, profile, token } = await authService.register(input)

  // Когда подтверждение почты обязательно, сессия при регистрации не
  // выдаётся: иначе пользователь оказался бы внутри приложения ровно до
  // истечения куки, хотя login его бы уже не пустил. Клиент по
  // verificationRequired показывает экран «проверьте почту».
  if (env.REQUIRE_EMAIL_VERIFICATION) {
    res.status(201).json({ user, profile, verificationRequired: true })
    return
  }

  setSessionCookie(res, token)
  res.status(201).json({ user, profile, verificationRequired: false })
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body)
  const { user, profile, token } = await authService.login(input)
  setSessionCookie(res, token)
  res.json({ user, profile })
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Токен самодостаточен, отзывать на сервере нечего — выход это ровно
  // «убрать куку». Смысл эндпоинта в том, что httpOnly-куку не может
  // удалить клиентский JavaScript.
  clearSessionCookie(res)
  res.status(204).end()
}

export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const input = requestPasswordResetSchema.parse(req.body)
  await authService.requestPasswordReset(input.email)
  // 204 всегда, даже если такого адреса нет: иначе форма восстановления
  // превращается в проверку «зарегистрирован ли этот email».
  res.status(204).end()
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input = resetPasswordSchema.parse(req.body)
  await authService.resetPassword(input.token, input.password)
  // Пароль изменён — прежняя сессия в этом браузере больше не нужна,
  // пользователь входит заново уже с новым паролем.
  clearSessionCookie(res)
  res.status(204).end()
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const input = verifyEmailSchema.parse(req.body)
  await authService.verifyEmail(input.token)
  res.status(204).end()
}

export async function resendVerification(req: Request, res: Response): Promise<void> {
  const input = resendVerificationSchema.parse(req.body)
  await authService.resendVerification(input.email)
  res.status(204).end()
}
