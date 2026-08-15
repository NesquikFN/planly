/**
 * TLS нужен только когда соединение реально уходит наружу.
 *
 * Внутренняя сеть Railway (*.railway.internal) и локальная база его не
 * поддерживают — и с включённым ssl node-postgres падает с «The server
 * does not support SSL connections» ещё до первого запроса. Для всего
 * остального (публичный прокси Railway, Supabase, любой внешний хост)
 * TLS обязателен; rejectUnauthorized: false избавляет от необходимости
 * подключать CA-бандл каждого провайдера.
 *
 * Живёт отдельным файлом, а не внутри config/db.ts, потому что нужен ещё
 * и скриптам переноса — а те не должны тянуть за собой config/env с его
 * обязательными переменными.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export function needsSsl(connectionString: string): boolean {
  if (connectionString.includes('railway.internal')) return false
  try {
    return !LOCAL_HOSTS.has(new URL(connectionString).hostname)
  } catch {
    // Строка не разобралась как URL — не гадаем и оставляем TLS
    // включённым: небезопасный дефолт хуже непонятной ошибки.
    return true
  }
}

/** Готовое значение для поля `ssl` в конфиге pg.Pool. */
export function sslConfig(connectionString: string): false | { rejectUnauthorized: false } {
  return needsSsl(connectionString) ? { rejectUnauthorized: false } : false
}
