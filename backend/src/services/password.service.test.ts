import assert from 'node:assert/strict'
import test from 'node:test'
import bcrypt from 'bcryptjs'
import { hashPassword, needsRehash, verifyPassword } from './password.service'

test('верный пароль подтверждается, неверный — нет', async () => {
  const stored = await hashPassword('correct horse battery staple')

  assert.equal(await verifyPassword('correct horse battery staple', stored), true)
  assert.equal(await verifyPassword('correct horse battery stapl', stored), false)
  assert.equal(await verifyPassword('', stored), false)
})

test('одинаковые пароли дают разные хеши (соль случайна)', async () => {
  const a = await hashPassword('one and the same')
  const b = await hashPassword('one and the same')

  assert.notEqual(a, b)
  // Обе строки при этом рабочие: соль хранится внутри самой строки.
  assert.equal(await verifyPassword('one and the same', a), true)
  assert.equal(await verifyPassword('one and the same', b), true)
})

test('в хеше нет самого пароля', async () => {
  const stored = await hashPassword('plaintext-must-not-appear')
  assert.equal(stored.includes('plaintext-must-not-appear'), false)
  assert.equal(stored.startsWith('scrypt$'), true)
})

test('bcrypt-хеш из Supabase проверяется и помечается на пересчёт', async () => {
  // Ровно тот формат, в котором Supabase Auth хранил
  // auth.users.encrypted_password.
  const fromSupabase = bcrypt.hashSync('password-set-in-supabase', 10)

  assert.equal(await verifyPassword('password-set-in-supabase', fromSupabase), true)
  assert.equal(await verifyPassword('not-that-one', fromSupabase), false)
  assert.equal(needsRehash(fromSupabase), true)
})

test('свежий scrypt-хеш пересчитывать не нужно', async () => {
  assert.equal(needsRehash(await hashPassword('whatever')), false)
})

test('битая строка хеша — это «не подошёл», а не исключение', async () => {
  const cases = ['', 'nonsense', 'scrypt$', 'bcrypt$16384$8$1$c2FsdA==$aGFzaA==', 'scrypt$x$y$z$c2FsdA==$aGFzaA==', '$2b$10$too-short']
  for (const broken of cases) {
    assert.equal(await verifyPassword('anything', broken), false, `не отклонён: ${JSON.stringify(broken)}`)
  }
})
