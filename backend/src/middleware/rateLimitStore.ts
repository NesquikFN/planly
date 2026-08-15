import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit'
import { query } from '../config/db'

/**
 * Store для express-rate-limit поверх Postgres (таблица rate_limit_hits,
 * migrations/0001). Нужен там, где счётчик обязан пережить рестарт
 * процесса: MemoryStore живёт в памяти, поэтому любой деплой снимал бы
 * часовые лимиты сразу со всех пользователей.
 *
 * Окно считается «скользящим от первого запроса», ровно как в
 * MemoryStore: первый запрос ставит expires_at = now() + windowMs,
 * следующие лишь увеличивают счётчик, а после конца окна та же строка
 * переиспользуется с hits = 1. Вся эта логика — в одном
 * INSERT ... ON CONFLICT, поэтому параллельные запросы одного
 * пользователя не могут потерять инкремент (в отличие от
 * read-modify-write в двух запросах).
 */

interface HitsRow {
  hits: number
  /** config/db.ts парсит timestamptz в ISO-строку, а не в Date. */
  expires_at: string
}

/** Уборка строк с истёкшим окном. Один таймер на процесс, а не на каждый
 * лимитер: DELETE всё равно общий для всей таблицы. */
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000
let cleanupStarted = false

function startExpiredHitsCleanup(): void {
  if (cleanupStarted) return
  cleanupStarted = true

  const timer = setInterval(() => {
    query('delete from rate_limit_hits where expires_at <= now()').catch((error: unknown) =>
      console.error('Не удалось убрать устаревшие счётчики лимитов:', error),
    )
  }, CLEANUP_INTERVAL_MS)
  // Уборка не должна держать процесс живым при остановке сервиса.
  timer.unref?.()
}

export class PostgresRateLimitStore implements Store {
  /** false — именно поэтому этот store и существует: счётчик общий, а не
   * локальный для инстанса процесса. */
  readonly localKeys = false

  /** Все лимитеры делят одну таблицу, а keyGenerator возвращает один и тот
   * же `user:<uuid>` для каждого из них — без префикса сброс пароля съедал
   * бы квоту входа. */
  readonly prefix: string

  private windowSeconds = 0

  constructor(name: string) {
    this.prefix = `${name}:`
  }

  init(options: Options): void {
    this.windowSeconds = options.windowMs / 1000
    startExpiredHitsCleanup()
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const { rows } = await query<HitsRow>(
      `insert into rate_limit_hits (key, hits, expires_at)
       values ($1, 1, now() + make_interval(secs => $2::double precision))
       on conflict (key) do update set
         hits = case when rate_limit_hits.expires_at <= now() then 1 else rate_limit_hits.hits + 1 end,
         expires_at = case when rate_limit_hits.expires_at <= now()
                           then excluded.expires_at
                           else rate_limit_hits.expires_at end
       returning hits, expires_at`,
      [this.prefix + key, this.windowSeconds],
    )
    return toInfo(rows[0])
  }

  async decrement(key: string): Promise<void> {
    // Только в пределах текущего окна: вычитать из уже протухшей строки
    // означало бы испортить счётчик следующего окна.
    await query(
      `update rate_limit_hits set hits = greatest(hits - 1, 0)
       where key = $1 and expires_at > now()`,
      [this.prefix + key],
    )
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const { rows } = await query<HitsRow>(
      'select hits, expires_at from rate_limit_hits where key = $1 and expires_at > now()',
      [this.prefix + key],
    )
    return rows[0] ? toInfo(rows[0]) : undefined
  }

  async resetKey(key: string): Promise<void> {
    await query('delete from rate_limit_hits where key = $1', [this.prefix + key])
  }

  /** Только собственные ключи: сброс одного лимитера не должен задевать
   * счётчики остальных. */
  async resetAll(): Promise<void> {
    await query('delete from rate_limit_hits where key like $1', [`${this.prefix}%`])
  }
}

function toInfo(row: HitsRow): ClientRateLimitInfo {
  return { totalHits: row.hits, resetTime: new Date(row.expires_at) }
}
