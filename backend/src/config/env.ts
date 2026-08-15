import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  // 4000, а не 3000: на 3000 в разработке живёт Next.js (frontend).
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL обязателен (строка подключения к Postgres)'),
  // Подписывает сессионные токены. Меняешь значение — разлогинивает всех.
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET должен быть не короче 16 символов (openssl rand -hex 32)'),
  // Кука с сессией. Имя вынесено в env, чтобы прод и локальная разработка
  // в одном браузере не перетирали сессии друг друга.
  SESSION_COOKIE_NAME: z.string().min(1).default('planly_session'),
  // На каком домене видна кука. Пусто = хост backend'а (обычное
  // поведение). Задавать только если фронт и бэк живут на поддоменах
  // одного домена и куку нужно расшарить: '.planly.app'.
  SESSION_COOKIE_DOMAIN: z.string().optional().default(''),
  // Запрещать вход до подтверждения почты. По умолчанию false: без
  // настроенной отправки писем (RESEND_API_KEY) это заперло бы всех
  // пользователей снаружи.
  REQUIRE_EMAIL_VERIFICATION: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((value) => value === 'true'),
  // Отправка писем (подтверждение почты, сброс пароля) через Resend HTTP
  // API. Пусто — письма не отправляются, а ссылка пишется в лог: этого
  // достаточно для локальной разработки и не превращает отсутствие SMTP
  // в неработающую регистрацию.
  RESEND_API_KEY: z.string().optional().default(''),
  MAIL_FROM: z.string().optional().default('Planly <onboarding@resend.dev>'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Некорректные переменные среды:', z.treeifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data

/**
 * Кросс-доменная ли связка фронт↔бэк. На Railway это всегда так
 * (planly-frontend.up.railway.app ↔ planly-backend.up.railway.app), и
 * тогда сессионная кука обязана быть SameSite=None; Secure — иначе
 * браузер просто не отправит её с fetch'ем фронтенда.
 *
 * Локально фронт и бэк оба на localhost (разные порты — это тот же
 * site), поэтому там достаточно SameSite=Lax: None без Secure браузеры
 * отбрасывают, а Secure на http не работает.
 */
export const isCrossSiteSetup = env.NODE_ENV === 'production'
