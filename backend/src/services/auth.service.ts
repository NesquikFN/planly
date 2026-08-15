import { createHash, randomBytes } from 'node:crypto'
import { env } from '../config/env'
import { withTransaction } from '../config/db'
import { authTokensRepository } from '../repositories/auth-tokens.repository'
import { profilesRepository } from '../repositories/profiles.repository'
import { toAuthUser, usersRepository } from '../repositories/users.repository'
import { AppError } from '../utils/AppError'
import { hashPassword, verifyPassword } from './password.service'
import { sendPasswordResetEmail, sendVerificationEmail } from './mailer.service'
import { signSession } from './session.service'
import type { AuthTokenPurpose, AuthUser, Profile } from '../types/user'

export interface AuthResult {
  user: AuthUser
  profile: Profile
  token: string
}

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

/** Один и тот же адрес не должен давать двух пользователей из-за
 * регистра или случайного пробела при вводе. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function register(input: {
  email: string
  password: string
  firstName?: string
  fullName?: string
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email)

  // Явная проверка ради понятного сообщения; гонку всё равно ловит
  // unique-ограничение ниже.
  if (await usersRepository.findByEmail(email)) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Пользователь с таким email уже зарегистрирован.')
  }

  const passwordHash = await hashPassword(input.password)

  let created: { user: AuthUser; profile: Profile }
  try {
    created = await withTransaction(async (client) => {
      const row = await usersRepository.create(client, { email, passwordHash })
      const profile = await profilesRepository.create(client, {
        id: row.id,
        email,
        firstName: input.firstName,
        fullName: input.fullName,
      })
      return { user: toAuthUser(row), profile }
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Пользователь с таким email уже зарегистрирован.')
    }
    throw error
  }

  await issueEmailVerification(created.user.id, email)

  return { ...created, token: issueSession(created.user) }
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email)
  const row = await usersRepository.findByEmail(email)

  // Пароль проверяется даже когда пользователя нет — иначе разница во
  // времени ответа сама сообщала бы, зарегистрирован ли адрес.
  const matches = await verifyPassword(input.password, row?.password_hash ?? DUMMY_HASH)

  if (!row || !matches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Неверный email или пароль.')
  }

  if (env.REQUIRE_EMAIL_VERIFICATION && row.email_verified_at === null) {
    throw new AppError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Подтвердите email — мы отправили письмо со ссылкой.',
    )
  }

  const user = toAuthUser(row)
  const profile = await profilesRepository.findById(user.id)
  if (!profile) {
    // Возможно только если строку профиля удалили руками: транзакция
    // регистрации создаёт их вместе.
    throw new AppError(500, 'PROFILE_MISSING', 'Профиль пользователя не найден.')
  }

  return { user, profile, token: issueSession(user) }
}

/**
 * Всегда завершается успешно, даже если такого адреса нет: ответ формы
 * восстановления не должен показывать, зарегистрирован ли email.
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail)
  const row = await usersRepository.findByEmail(email)
  if (!row) return

  await authTokensRepository.invalidateAllFor(row.id, 'password_reset')
  const token = await issueToken(row.id, 'password_reset', PASSWORD_RESET_TTL_MS)
  await sendPasswordResetEmail(email, token)
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await authTokensRepository.consume(hashToken(token), 'password_reset')
  if (!record) {
    throw new AppError(
      400,
      'INVALID_TOKEN',
      'Ссылка недействительна или устарела. Запросите восстановление ещё раз.',
    )
  }

  await usersRepository.updatePasswordHash(record.user_id, await hashPassword(newPassword))
  // Сброс пароля подтверждает и владение почтой — второй раз просить
  // подтверждение бессмысленно.
  await usersRepository.markEmailVerified(record.user_id)
}

export async function verifyEmail(token: string): Promise<void> {
  const record = await authTokensRepository.consume(hashToken(token), 'email_verification')
  if (!record) {
    throw new AppError(400, 'INVALID_TOKEN', 'Ссылка недействительна или устарела.')
  }
  await usersRepository.markEmailVerified(record.user_id)
}

/** Как и requestPasswordReset — молча ничего не делает для незнакомого
 * или уже подтверждённого адреса. */
export async function resendVerification(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail)
  const row = await usersRepository.findByEmail(email)
  if (!row || row.email_verified_at !== null) return

  await authTokensRepository.invalidateAllFor(row.id, 'email_verification')
  await issueEmailVerification(row.id, email)
}

function issueSession(user: AuthUser): string {
  return signSession({ sub: user.id, email: user.email }, env.JWT_SECRET)
}

async function issueEmailVerification(userId: string, email: string): Promise<void> {
  const token = await issueToken(userId, 'email_verification', EMAIL_VERIFICATION_TTL_MS)
  await sendVerificationEmail(email, token)
}

/** Возвращает сырой токен (он уходит только в письмо); в базу ложится
 * его sha256 — дамп БД не должен давать возможность войти по чужой
 * ссылке. sha256 без соли здесь достаточно: токен и так 256 бит
 * случайности, перебирать нечего. */
async function issueToken(
  userId: string,
  purpose: AuthTokenPurpose,
  ttlMs: number,
): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await authTokensRepository.create({
    userId,
    tokenHash: hashToken(token),
    purpose,
    expiresAt: new Date(Date.now() + ttlMs),
  })
  return token
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Валидная по формату, но заведомо не совпадающая ни с одним паролем
 * строка — нужна только чтобы login тратил время на scrypt и когда
 * пользователя нет. */
const DUMMY_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23505'
  )
}
