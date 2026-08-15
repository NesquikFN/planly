import assert from 'node:assert/strict'
import test from 'node:test'
import { AppError } from '../utils/AppError'
import { signSession, verifySession, type SessionPayload } from './session.service'

const SECRET = 'test-secret-not-used-anywhere-real'
const OTHER_SECRET = 'another-secret-entirely-different'

test('подписанный токен читается тем же секретом', () => {
  const token = signSession({ sub: 'user-1', email: 'a@b.test' }, SECRET)
  const payload = verifySession(token, SECRET)

  assert.equal(payload.sub, 'user-1')
  assert.equal(payload.email, 'a@b.test')
  assert.ok(payload.exp > payload.iat)
})

test('токен, подписанный другим секретом, отклоняется', () => {
  const token = signSession({ sub: 'user-1', email: 'a@b.test' }, OTHER_SECRET)

  assert.throws(
    () => verifySession(token, SECRET),
    (error: unknown) => error instanceof AppError && error.status === 401 && error.code === 'INVALID_SESSION',
  )
})

test('подделка полезной нагрузки без пересчёта подписи не проходит', () => {
  const token = signSession({ sub: 'user-1', email: 'a@b.test' }, SECRET)
  const [body, signature] = token.split('.')

  const tampered = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
  tampered.sub = 'somebody-else'
  const forgedBody = Buffer.from(JSON.stringify(tampered), 'utf8').toString('base64url')

  assert.throws(
    () => verifySession(`${forgedBody}.${signature}`, SECRET),
    (error: unknown) => error instanceof AppError && error.code === 'INVALID_SESSION',
  )
})

test('истёкший токен отличается от недействительного отдельным кодом', () => {
  const token = signSession({ sub: 'user-1', email: 'a@b.test' }, SECRET, -1)

  assert.throws(
    () => verifySession(token, SECRET),
    (error: unknown) => error instanceof AppError && error.status === 401 && error.code === 'SESSION_EXPIRED',
  )
})

test('мусор вместо токена не роняет процесс, а даёт 401', () => {
  for (const garbage of ['', 'not-a-token', 'a.b.c', '....', 'YWJj.YWJj']) {
    assert.throws(
      () => verifySession(garbage, SECRET),
      (error: unknown) => error instanceof AppError && error.status === 401,
      `не отклонён: ${JSON.stringify(garbage)}`,
    )
  }
})
