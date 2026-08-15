import assert from 'node:assert/strict'
import test from 'node:test'
import { hashPassword, verifyPassword } from './password.service'

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

test('битая строка хеша — это «не подошёл», а не исключение', async () => {
  for (const broken of ['', 'nonsense', 'scrypt$', 'bcrypt$16384$8$1$c2FsdA==$aGFzaA==', 'scrypt$x$y$z$c2FsdA==$aGFzaA==']) {
    assert.equal(await verifyPassword('anything', broken), false, `не отклонён: ${JSON.stringify(broken)}`)
  }
})
