// Должен быть первым импортом — см. комментарий в testEnv.
import './testEnv'

import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { app } from '../app'
import { signSession } from '../services/session.service'

const SECRET = process.env.JWT_SECRET as string
const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'planly_session'

// Приватные маршруты. Ни один из них не должен пускать дальше
// requireAuth, поэтому до базы (её в тестах нет) выполнение не доходит.
const PRIVATE_ROUTES: [string, string][] = [
  ['get', '/api/me'],
  ['patch', '/api/me'],
  ['get', '/api/tasks'],
  ['post', '/api/tasks'],
  ['patch', '/api/tasks/3f2504e0-4f89-11d3-9a0c-0305e82c3301'],
  ['delete', '/api/tasks/3f2504e0-4f89-11d3-9a0c-0305e82c3301'],
  ['post', '/api/tasks/import'],
  ['get', '/api/calendar-events'],
  ['post', '/api/calendar-events'],
  ['patch', '/api/calendar-events/3f2504e0-4f89-11d3-9a0c-0305e82c3301'],
  ['delete', '/api/calendar-events/3f2504e0-4f89-11d3-9a0c-0305e82c3301'],
]

test('без сессии каждый приватный маршрут отвечает 401', async () => {
  for (const [method, path] of PRIVATE_ROUTES) {
    const response = await (request(app) as never as Record<string, (p: string) => request.Test>)[method](path)
    assert.equal(response.status, 401, `${method.toUpperCase()} ${path}`)
    assert.equal(response.body.error.code, 'UNAUTHORIZED')
  }
})

test('кука с чужой подписью не даёт доступа', async () => {
  const forged = signSession({ sub: 'someone', email: 'a@b.test' }, 'completely-different-secret')

  const response = await request(app).get('/api/me').set('Cookie', `${COOKIE}=${forged}`)

  assert.equal(response.status, 401)
  assert.equal(response.body.error.code, 'INVALID_SESSION')
})

test('истёкшая сессия отвергается отдельным кодом', async () => {
  const expired = signSession({ sub: 'someone', email: 'a@b.test' }, SECRET, -1)

  const response = await request(app).get('/api/me').set('Cookie', `${COOKIE}=${expired}`)

  assert.equal(response.status, 401)
  assert.equal(response.body.error.code, 'SESSION_EXPIRED')
})

test('выход очищает куку и не требует сессии', async () => {
  const response = await request(app).post('/api/auth/logout')

  assert.equal(response.status, 204)
  // Node отдаёт set-cookie массивом, но типы supertest объявляют заголовки
  // как строки — приводим к одному виду, а не подстраиваем утверждение.
  const raw: unknown = response.headers['set-cookie']
  const setCookie = Array.isArray(raw) ? raw.join(';') : String(raw ?? '')
  assert.ok(setCookie.includes(COOKIE), 'кука сессии не сброшена')
})

test('валидация входа отсекает мусор до обращения к базе', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
})

test('регистрация требует пароль не короче 8 символов', async () => {
  const response = await request(app).post('/api/auth/register').send({ email: 'a@b.test', password: 'short' })

  assert.equal(response.status, 400)
  assert.equal(response.body.error.code, 'VALIDATION_ERROR')
})

test('неизвестный маршрут даёт 404 в общем формате ошибок', async () => {
  const response = await request(app).get('/api/nope')

  assert.equal(response.status, 404)
  assert.equal(response.body.error.code, 'ROUTE_NOT_FOUND')
})

test('ответы API помечены как некешируемые и с заголовками безопасности', async () => {
  const response = await request(app).get('/api/me')

  assert.equal(response.headers['cache-control'], 'no-store')
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['x-frame-options'], 'DENY')
  assert.equal(response.headers['x-powered-by'], undefined)
})
