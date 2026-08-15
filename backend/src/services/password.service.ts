import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import bcrypt from 'bcryptjs'

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
 *
 * Отдельно поддерживается bcrypt ($2a$/$2b$/$2y$) — в этом формате
 * Supabase Auth хранил пароли в auth.users.encrypted_password. Иначе
 * перенос данных означал бы, что все пользователи теряют пароли, а
 * восстановить их было бы нечем: отправка писем пока не настроена.
 * Через bcryptjs, а не через нативный bcrypt: тот пришлось бы собирать
 * под alpine, ровно та же причина, по которой основной алгоритм —
 * встроенный scrypt.
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

/** Пароли, перенесённые из Supabase. Проверять их мы умеем, но хранить
 * дальше в чужом формате незачем — см. needsRehash. */
function isBcryptHash(stored: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(stored)
}

/**
 * Нужно ли пересчитать хеш после успешного входа. Так перенесённые из
 * Supabase bcrypt-пароли по одному переезжают на scrypt — молча, ровно в
 * тот момент, когда пароль в открытом виде и так есть в памяти. Когда
 * последний пользователь войдёт, ветку bcrypt можно будет удалить.
 */
export function needsRehash(stored: string): boolean {
  return isBcryptHash(stored)
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) {
    try {
      return await bcrypt.compare(password, stored)
    } catch {
      return false
    }
  }

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
