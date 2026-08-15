import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

/**
 * Хеширование паролей на встроенном в Node scrypt.
 *
 * Не argon2 и не bcrypt сознательно: обе — нативные модули, которые надо
 * собирать под alpine в Docker-образе Railway, а scrypt входит в
 * стандартную библиотеку Node, признан RFC 7914 и для этого приложения
 * ничем не хуже. Тот же принцип, что и в session.service: не тянуть
 * зависимость ради одной функции.
 *
 * Формат строки: scrypt$N$r$p$<salt base64>$<hash base64>. Параметры
 * лежат внутри самой строки, поэтому их можно поднять позже, не ломая
 * уже сохранённые хеши — старые проверятся по своим значениям.
 */

const N = 16384 // 2^14 — рекомендованный минимум для интерактивного входа
const R = 8
const P = 1
const KEY_LENGTH = 32
const SALT_LENGTH = 16
// scrypt требует примерно 128 * N * r байт; дефолтный лимит Node (32 МБ)
// впритык, поэтому задаём явно с запасом.
const MAX_MEM = 64 * 1024 * 1024

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const hash = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEM })
  return ['scrypt', N, R, P, salt.toString('base64'), hash.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts
  const n = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  const salt = Buffer.from(saltRaw, 'base64')
  const expected = Buffer.from(hashRaw, 'base64')
  if (salt.length === 0 || expected.length === 0) return false

  let actual: Buffer
  try {
    actual = await scrypt(password, salt, expected.length, { N: n, r, p, maxmem: MAX_MEM })
  } catch {
    // Битая или враждебная строка хеша (например, абсурдный N) не должна
    // ронять процесс — это просто «пароль не подошёл».
    return false
  }

  return timingSafeEqual(actual, expected)
}
