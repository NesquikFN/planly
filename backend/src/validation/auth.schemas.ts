import { z } from 'zod'

// Минимум 8 символов, а не 6 как было в Supabase: раз политику паролей
// теперь задаём мы сами, нет причин оставлять прежний слабый порог.
// Верхняя граница нужна против «DoS длинным паролем» — scrypt честно
// прожевал бы и мегабайт.
const password = z
  .string()
  .min(8, 'Пароль должен быть не короче 8 символов')
  .max(200, 'Пароль слишком длинный')

const email = z
  .email('Некорректный email')
  .max(254, 'Email слишком длинный')

export const registerSchema = z.object({
  email,
  password,
  firstName: z.string().trim().max(100).optional(),
  fullName: z.string().trim().max(200).optional(),
})

export const loginSchema = z.object({
  email,
  // Без min(8): проверять политику паролей на входе бессмысленно и
  // вредно — это подсказывало бы требования к чужим паролям.
  password: z.string().min(1, 'Введите пароль').max(200),
})

export const requestPasswordResetSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Ссылка недействительна'),
  password,
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Ссылка недействительна'),
})

export const resendVerificationSchema = z.object({ email })
