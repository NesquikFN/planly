import type { PoolClient } from 'pg'
import { query } from '../config/db'
import type { Profile, UpdateProfileInput } from '../types/user'

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  phone: string | null
  job_title: string | null
  company: string | null
  bio: string | null
  avatar_url: string | null
  timezone: string
  language: string
  created_at: string
  updated_at: string
}

// Преобразование snake_case (БД) <-> camelCase (тип приложения) живёт
// только здесь. Всё, что выше репозитория, о колонках не знает.
function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    phone: row.phone,
    jobTitle: row.job_title,
    company: row.company,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    timezone: row.timezone,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Только те колонки, которые реально пришли в patch — частичное
 * обновление, а не замена всей строки. Ключи здесь захардкожены (а не
 * собраны из объекта), поэтому в SQL не может попасть имя колонки из
 * тела запроса. */
const UPDATABLE_COLUMNS: Record<keyof UpdateProfileInput, string> = {
  fullName: 'full_name',
  firstName: 'first_name',
  lastName: 'last_name',
  displayName: 'display_name',
  phone: 'phone',
  jobTitle: 'job_title',
  company: 'company',
  bio: 'bio',
  avatarUrl: 'avatar_url',
  timezone: 'timezone',
  language: 'language',
}

export const profilesRepository = {
  async findById(userId: string): Promise<Profile | null> {
    const { rows } = await query<ProfileRow>('select * from profiles where id = $1', [userId])
    return rows[0] ? toProfile(rows[0]) : null
  },

  /** Создаётся вместе с пользователем, в той же транзакции. */
  async create(
    client: PoolClient,
    input: { id: string; email: string; firstName?: string; fullName?: string },
  ): Promise<Profile> {
    const { rows } = await client.query<ProfileRow>(
      `insert into profiles (id, email, first_name, full_name, display_name)
       values ($1, $2, $3, $4, $4)
       returning *`,
      [input.id, input.email, input.firstName ?? null, input.fullName ?? null],
    )
    return toProfile(rows[0])
  },

  async update(userId: string, patch: UpdateProfileInput): Promise<Profile> {
    const assignments: string[] = []
    const params: unknown[] = [userId]

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      const value = patch[key as keyof UpdateProfileInput]
      if (value === undefined) continue
      params.push(value)
      assignments.push(`${column} = $${params.length}`)
    }

    // Пустой patch: возвращаем текущую строку вместо синтаксически
    // некорректного `update ... set  where`.
    if (assignments.length === 0) {
      const current = await this.findById(userId)
      if (!current) throw new Error(`Профиль ${userId} не найден`)
      return current
    }

    const { rows } = await query<ProfileRow>(
      `update profiles set ${assignments.join(', ')} where id = $1 returning *`,
      params,
    )
    return toProfile(rows[0])
  },
}
