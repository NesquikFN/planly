import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { mailRateLimiter } from '../middleware/rateLimit'

// Весь роутер уже под authRateLimiter (см. routes/index.ts) — это защита
// от перебора паролей. mailRateLimiter добавлен только там, где запрос
// приводит к реально отправленному письму.
export const authRouter = Router()

authRouter.post('/register', mailRateLimiter, authController.register)
authRouter.post('/login', authController.login)
authRouter.post('/logout', authController.logout)

authRouter.post('/password-reset', mailRateLimiter, authController.requestPasswordReset)
authRouter.post('/password-reset/confirm', authController.resetPassword)

authRouter.post('/verify-email', authController.verifyEmail)
authRouter.post('/verify-email/resend', mailRateLimiter, authController.resendVerification)
