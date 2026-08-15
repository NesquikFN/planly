import { query } from '../config/db'
import type { AuthTokenPurpose } from '../types/user'

interface AuthTokenRow {
  id: string
  user_id: string
  token_hash: string
  purpose: AuthTokenPurpose
  expires_at: string
  used_at: string | null
  created_at: string
}

export const authTokensRepository = {
  async create(input: {
    userId: string
    tokenHash: string
    purpose: AuthTokenPurpose
    expiresAt: Date
  }): Promise<void> {
    await query(
      `insert into auth_tokens (user_id, token_hash, purpose, expires_at)
       values ($1, $2, $3, $4)`,
      [input.userId, input.tokenHash, input.purpose, input.expiresAt.toISOString()],
    )
  },

  /**
   * Атомарно помечает токен использованным и возвращает его — поэтому
   * двойной клик по ссылке из письма не может сработать дважды: второй
   * запрос не найдёт строку с used_at is null. Проверка срока здесь же,
   * в том же операторе, а не отдельным чтением.
   */
  async consume(tokenHash: string, purpose: AuthTokenPurpose): Promise<AuthTokenRow | null> {
    const { rows } = await query<AuthTokenRow>(
      `update auth_tokens set used_at = now()
       where token_hash = $1
         and purpose = $2
         and used_at is null
         and expires_at > now()
       returning *`,
      [tokenHash, purpose],
    )
    return rows[0] ?? null
  },

  /** Гасит прежние неиспользованные токены того же назначения: запросив
   * новую ссылку восстановления, пользователь ожидает, что старая
   * перестанет работать. */
  async invalidateAllFor(userId: string, purpose: AuthTokenPurpose): Promise<void> {
    await query(
      `update auth_tokens set used_at = now()
       where user_id = $1 and purpose = $2 and used_at is null`,
      [userId, purpose],
    )
  },
}
