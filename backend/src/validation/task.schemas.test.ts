import assert from 'node:assert/strict'
import test from 'node:test'
import { createTaskSchema, taskIdParamSchema, updateTaskSchema } from './task.schemas'

test('создание задачи: минимального тела достаточно, дефолты подставляются', () => {
  const parsed = createTaskSchema.parse({ title: 'Купить хлеб' })

  assert.equal(parsed.title, 'Купить хлеб')
  assert.equal(parsed.dueLabel, '')
  assert.equal(parsed.priority, 'none')
  assert.equal(parsed.completed, false)
  assert.equal(parsed.important, false)
})

test('создание задачи: пустое или пробельное название отклоняется', () => {
  assert.throws(() => createTaskSchema.parse({ title: '' }))
  assert.throws(() => createTaskSchema.parse({ title: '   ' }))
})

test('создание задачи: приоритет вне списка отклоняется', () => {
  assert.throws(() => createTaskSchema.parse({ title: 'x', priority: 'critical' }))
})

test('создание задачи: неверные форматы даты и времени отклоняются', () => {
  assert.throws(() => createTaskSchema.parse({ title: 'x', date: '22.07.2024' }))
  assert.throws(() => createTaskSchema.parse({ title: 'x', time: '25:00' }))
  assert.throws(() => createTaskSchema.parse({ title: 'x', time: '9:00' }))

  assert.equal(createTaskSchema.parse({ title: 'x', date: '2024-07-22' }).date, '2024-07-22')
  assert.equal(createTaskSchema.parse({ title: 'x', time: '09:00' }).time, '09:00')
})

test('обновление: null очищает поле, отсутствие поля его не трогает', () => {
  const cleared = updateTaskSchema.parse({ date: null })
  assert.equal(cleared.date, null)
  assert.equal('time' in cleared, false)
})

test('обновление: пустое тело отклоняется, а не молча ничего не делает', () => {
  assert.throws(() => updateTaskSchema.parse({}))
})

test('id в пути: не-UUID отсекается до похода в Postgres', () => {
  assert.throws(() => taskIdParamSchema.parse({ id: 'abc' }))
  assert.throws(() => taskIdParamSchema.parse({ id: '../../etc/passwd' }))
  assert.throws(() => taskIdParamSchema.parse({ id: '' }))

  const valid = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'
  assert.equal(taskIdParamSchema.parse({ id: valid }).id, valid)
})
