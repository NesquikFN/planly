/** Пользователь, которого requireAuth кладёт в req.user. Никогда не
 * содержит password_hash — эта колонка читается только в auth.service. */
export interface AuthUser {
  id: string
  email: string
  emailVerified: boolean
  createdAt: string
}

/** Профиль — всё, что показывается в интерфейсе. Один-к-одному с users,
 * но отдельной строкой (см. migrations/0001). */
export interface Profile {
  id: string
  email: string | null
  fullName: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  phone: string | null
  jobTitle: string | null
  company: string | null
  bio: string | null
  avatarUrl: string | null
  timezone: string
  language: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  displayName?: string | null
  phone?: string | null
  jobTitle?: string | null
  company?: string | null
  bio?: string | null
  avatarUrl?: string | null
  timezone?: string
  language?: string
}

export type AuthTokenPurpose = 'email_verification' | 'password_reset'
