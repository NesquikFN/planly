import { z } from 'zod'
import { dateString, timeString, uuidParam, weekdaysSchema } from './common.schemas'

const priority = z.enum(['overdue', 'important', 'upcoming', 'none'])

const recurrence = z.object({
  rule: z.enum(['none', 'daily', 'weekdays', 'weekly', 'custom']),
  weekdays: weekdaysSchema,
  time: timeString.optional(),
})

// Поля, которые может прислать клиент. user_id в этот список не входит и
// входить не должен: он всегда берётся из сессии.
const taskFields = {
  title: z.string().trim().min(1, 'Название задачи не может быть пустым').max(500),
  dueLabel: z.string().max(200).default(''),
  priority: priority.default('none'),
  completed: z.boolean().default(false),
  important: z.boolean().default(false),
  date: dateString.nullish(),
  time: timeString.nullish(),
  completedAt: z.iso.datetime({ offset: true }).nullish(),
  recurrence: recurrence.nullish(),
}

export const createTaskSchema = z.object({
  // id разрешён: задачи создаются оптимистично на клиенте и должны
  // сохранить свой идентификатор, иначе локальное состояние и облако
  // разъедутся сразу после создания.
  id: uuidParam('Некорректный id задачи').optional(),
  createdAt: z.iso.datetime({ offset: true }).optional(),
  ...taskFields,
})

export const updateTaskSchema = z
  .object({
    title: taskFields.title.optional(),
    dueLabel: z.string().max(200).optional(),
    priority: priority.optional(),
    completed: z.boolean().optional(),
    important: z.boolean().optional(),
    date: dateString.nullish(),
    time: timeString.nullish(),
    completedAt: z.iso.datetime({ offset: true }).nullish(),
    recurrence: recurrence.nullish(),
  })
  // Тело без единого известного поля почти всегда означает опечатку в
  // имени поля на клиенте — молчаливый 200 «ничего не изменено» такую
  // ошибку прятал бы.
  .refine((patch) => Object.keys(patch).length > 0, {
    message: 'Пустое тело запроса: нечего обновлять',
  })

/** Тело PUT /tasks/:id — задача целиком. id берётся из пути, а не из
 * тела: два разных источника одного идентификатора неизбежно однажды
 * разойдутся. */
export const replaceTaskSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }).optional(),
  ...taskFields,
})

export const importTasksSchema = z.object({
  tasks: z
    .array(createTaskSchema.extend({ id: uuidParam('Некорректный id задачи') }))
    .max(1000, 'За один раз можно перенести не больше 1000 задач'),
})

export const taskIdParamSchema = z.object({ id: uuidParam('Некорректный id задачи') })
