import type { PoolClient } from 'pg'
import { query } from '../config/db'
import type { AuthUser } from '../types/user'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

/** Проекция строки в то, что можно отдавать наружу: без password_hash.
 * Единственная точка, где это преобразование происходит, — поэтому хеш
 * физически не может утечь в ответ API вместе с остальными полями. */
export function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified_at !== null,
    createdAt: row.created_at,
  }
}

export const usersRepository = {
  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await query<UserRow>('select * from users where id = $1', [id])
    return rows[0] ?? null
  },

  /** Ищет по уже приведённому к нижнему регистру адресу — нормализация
   * происходит в auth.service, до попадания сюда. */
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await query<UserRow>('select * from users where email = $1', [email])
    return rows[0] ?? null
  },

  /** Принимает клиента транзакции: пользователь и его профиль создаются
   * вместе или никак (см. auth.service.register). */
  async create(
    client: PoolClient,
    input: { email: string; passwordHash: string },
  ): Promise<UserRow> {
    const { rows } = await client.query<UserRow>(
      `insert into users (email, password_hash)
       values ($1, $2)
       returning *`,
      [input.email, input.passwordHash],
    )
    return rows[0]
  },

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await query('update users set password_hash = $2 where id = $1', [userId, passwordHash])
  },

  async markEmailVerified(userId: string): Promise<void> {
    // coalesce, а не безусловная запись: повторное подтверждение не
    // должно двигать дату первого.
    await query(
      'update users set email_verified_at = coalesce(email_verified_at, now()) where id = $1',
      [userId],
    )
  },
}
