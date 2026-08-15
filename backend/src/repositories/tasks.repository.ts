import { query } from '../config/db'
import type { Task, TaskPriority, TaskRecurrence } from '../types/task'

interface TaskRow {
  id: string
  user_id: string
  title: string
  due_label: string
  priority: TaskPriority
  completed: boolean
  important: boolean
  date: string | null
  time: string | null
  completed_at: string | null
  recurrence: TaskRecurrence | null
  created_at: string
  updated_at: string
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    dueLabel: row.due_label,
    priority: row.priority,
    completed: row.completed,
    important: row.important,
    date: row.date ?? undefined,
    // В БД time хранится как "HH:MM:SS", в приложении — как "HH:MM".
    time: row.time ? row.time.slice(0, 5) : undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    recurrence: row.recurrence ?? undefined,
  }
}

/** Захардкоженное соответствие поле → колонка: имя колонки никогда не
 * приходит из тела запроса. */
const UPDATABLE_COLUMNS = {
  title: 'title',
  dueLabel: 'due_label',
  priority: 'priority',
  completed: 'completed',
  important: 'important',
  date: 'date',
  time: 'time',
  completedAt: 'completed_at',
  recurrence: 'recurrence',
} as const

export type TaskPatch = Partial<Record<keyof typeof UPDATABLE_COLUMNS, unknown>>

// user_id во всех запросах берётся из сессии (req.user.id) и всегда
// участвует в where — RLS больше нет, и это единственное, что не даёт
// одному пользователю тронуть задачу другого.
export const tasksRepository = {
  async findAllForUser(userId: string): Promise<Task[]> {
    const { rows } = await query<TaskRow>(
      'select * from tasks where user_id = $1 order by created_at desc',
      [userId],
    )
    return rows.map(toTask)
  },

  async create(userId: string, input: Omit<Task, 'id'> & { id?: string }): Promise<Task> {
    const { rows } = await query<TaskRow>(
      `insert into tasks
         (id, user_id, title, due_label, priority, completed, important,
          date, time, completed_at, recurrence, created_at)
       values (coalesce($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
               coalesce($12, now()))
       returning *`,
      [
        input.id ?? null,
        userId,
        input.title,
        input.dueLabel,
        input.priority,
        input.completed,
        input.important,
        input.date ?? null,
        input.time ?? null,
        input.completedAt ?? null,
        input.recurrence ?? null,
        input.createdAt ?? null,
      ],
    )
    return toTask(rows[0])
  },

  /**
   * Вставляет задачу целиком или, если строка с таким id уже есть,
   * заменяет её. Нужно для восстановления из архива: задача уже удалена
   * из базы, но у неё должен сохраниться прежний id, а повторное нажатие
   * «вернуть» не должно падать на конфликте.
   *
   * `where tasks.user_id = $2` в ветке do update принципиален: без него
   * можно было бы перезаписать чужую строку, угадав её id. С ним чужая
   * строка просто не обновляется, RETURNING ничего не отдаёт, и сервис
   * превращает это в 404.
   */
  async upsert(userId: string, task: Task): Promise<Task | null> {
    const { rows } = await query<TaskRow>(
      `insert into tasks
         (id, user_id, title, due_label, priority, completed, important,
          date, time, completed_at, recurrence, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, coalesce($12, now()))
       on conflict (id) do update set
         title = excluded.title,
         due_label = excluded.due_label,
         priority = excluded.priority,
         completed = excluded.completed,
         important = excluded.important,
         date = excluded.date,
         time = excluded.time,
         completed_at = excluded.completed_at,
         recurrence = excluded.recurrence
       where tasks.user_id = $2
       returning *`,
      [
        task.id,
        userId,
        task.title,
        task.dueLabel,
        task.priority,
        task.completed,
        task.important,
        task.date ?? null,
        task.time ?? null,
        task.completedAt ?? null,
        task.recurrence ?? null,
        task.createdAt ?? null,
      ],
    )
    return rows[0] ? toTask(rows[0]) : null
  },

  async update(userId: string, taskId: string, patch: TaskPatch): Promise<Task | null> {
    const assignments: string[] = []
    const params: unknown[] = [taskId, userId]

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      const value = patch[key as keyof typeof UPDATABLE_COLUMNS]
      if (value === undefined) continue
      params.push(value)
      assignments.push(`${column} = $${params.length}`)
    }

    if (assignments.length === 0) {
      const { rows } = await query<TaskRow>(
        'select * from tasks where id = $1 and user_id = $2',
        [taskId, userId],
      )
      return rows[0] ? toTask(rows[0]) : null
    }

    const { rows } = await query<TaskRow>(
      `update tasks set ${assignments.join(', ')}
       where id = $1 and user_id = $2
       returning *`,
      params,
    )
    return rows[0] ? toTask(rows[0]) : null
  },

  /** Возвращает false, если удалять было нечего: вызывающая сторона
   * (toggleComplete на клиенте) создаёт следующее вхождение только после
   * успешного удаления, поэтому тихий no-op здесь недопустим. */
  async remove(userId: string, taskId: string): Promise<boolean> {
    const { rowCount } = await query(
      'delete from tasks where id = $1 and user_id = $2',
      [taskId, userId],
    )
    return (rowCount ?? 0) > 0
  },

  /** Массовая вставка для разового переноса локальных задач в облако.
   * Существующие строки не трогает: повторный запуск переноса не должен
   * затирать то, что пользователь успел изменить онлайн. */
  async insertMissing(userId: string, tasks: Task[]): Promise<number> {
    if (tasks.length === 0) return 0

    // Один оператор на весь массив вместо запроса на задачу: перенос
    // может привезти сотни строк.
    const { rowCount } = await query(
      `insert into tasks
         (id, user_id, title, due_label, priority, completed, important,
          date, time, completed_at, recurrence, created_at)
       select
         (value->>'id')::uuid, $1, value->>'title', coalesce(value->>'dueLabel', ''),
         coalesce(value->>'priority', 'none'),
         coalesce((value->>'completed')::boolean, false),
         coalesce((value->>'important')::boolean, false),
         (value->>'date')::date, (value->>'time')::time,
         (value->>'completedAt')::timestamptz, value->'recurrence',
         coalesce((value->>'createdAt')::timestamptz, now())
       from jsonb_array_elements($2::jsonb) as value
       on conflict (id) do nothing`,
      [userId, JSON.stringify(tasks)],
    )
    return rowCount ?? 0
  },
}
