import pg from 'pg'
import { env } from './env'
import { sslConfig } from '../utils/postgresSsl'

// Остальной код (типы, Zod-схемы, JSON-ответы и фронтенд) ожидает
// timestamp-колонки строками ISO 8601 — ровно в том виде, в каком их
// всегда отдавал REST API Supabase, и в каком их разбирает
// `new Date(...)` на клиенте. node-postgres по умолчанию превращает
// timestamp(tz) в объекты Date, а его собственный текстовый формат
// ("2026-08-07 20:49:04+00") использует пробел вместо "T".
// OID: date=1082 (оставляем как есть — прогон через Date мог бы сдвинуть
// дату на сутки из-за таймзоны), timestamp=1114, timestamptz=1184.
pg.types.setTypeParser(1082, (value) => value)
pg.types.setTypeParser(1114, (value) => new Date(`${value}Z`).toISOString())
pg.types.setTypeParser(1184, (value) => new Date(value).toISOString())

// time (1083) — тоже строкой: в приложении это "HH:MM", а не момент
// времени, и Date для него бессмысленен.
pg.types.setTypeParser(1083, (value) => value)

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: sslConfig(env.DATABASE_URL),
})

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params)
}

/**
 * Явная транзакция для тех случаев, когда несколько операторов должны
 * примениться все вместе или ни одного. В этом приложении такой случай
 * ровно один — регистрация (строка в users и строка в profiles), — но
 * без транзакции она оставляла бы пользователя без профиля при падении
 * между двумя вставками.
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
