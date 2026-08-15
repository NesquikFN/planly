import assert from 'node:assert/strict'
import test from 'node:test'
import { createCalendarEventSchema, updateCalendarEventSchema } from './calendar.schemas'

const base = { title: 'Созвон', date: '2024-07-22', startTime: '10:00', endTime: '11:00' }

test('создание события: минимальное тело проходит и получает дефолты', () => {
  const parsed = createCalendarEventSchema.parse(base)

  assert.equal(parsed.calendarId, 'personal')
  assert.equal(parsed.important, false)
  assert.equal(parsed.allDay, false)
})

test('создание события: конец не может быть раньше или равен началу', () => {
  assert.throws(() => createCalendarEventSchema.parse({ ...base, startTime: '11:00', endTime: '10:00' }))
  assert.throws(() => createCalendarEventSchema.parse({ ...base, startTime: '10:00', endTime: '10:00' }))
})

test('создание события: повторение разбирается вместе с датой окончания', () => {
  const parsed = createCalendarEventSchema.parse({
    ...base,
    recurrence: { rule: 'weekly', weekdays: [0, 2], until: '2024-12-31' },
  })

  assert.equal(parsed.recurrence?.rule, 'weekly')
  assert.deepEqual(parsed.recurrence?.weekdays, [0, 2])
})

test('создание события: день недели вне 0..6 отклоняется', () => {
  assert.throws(() =>
    createCalendarEventSchema.parse({ ...base, recurrence: { rule: 'weekly', weekdays: [7] } }),
  )
})

test('обновление: проверка порядка времени срабатывает, когда пришли оба поля', () => {
  assert.throws(() => updateCalendarEventSchema.parse({ startTime: '12:00', endTime: '09:00' }))
  // Только одно из двух — вторую половину инварианта держит check в БД.
  assert.equal(updateCalendarEventSchema.parse({ endTime: '09:00' }).endTime, '09:00')
})

test('обновление: пустое тело отклоняется', () => {
  assert.throws(() => updateCalendarEventSchema.parse({}))
})
