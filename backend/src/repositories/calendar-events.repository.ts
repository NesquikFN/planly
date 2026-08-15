import { query } from '../config/db'
import type { CalendarEvent } from '../types/calendar'
import type { TaskRecurrenceRule } from '../types/task'

interface CalendarEventRow {
  id: string
  user_id: string
  title: string
  description: string | null
  date: string
  start_time: string
  end_time: string
  all_day: boolean
  calendar_id: string
  important: boolean
  timezone: string
  project: string | null
  project_id: string | null
  task: string | null
  recurrence_rule: TaskRecurrenceRule | null
  recurrence_weekdays: number[] | null
  recurrence_until: string | null
  skipped_dates: string[]
  series_id: string | null
  created_at: string
  updated_at: string
}

function toCalendarEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    // В БД time хранится как "HH:MM:SS", в приложении — как "HH:MM".
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    calendarId: row.calendar_id,
    important: row.important,
    allDay: row.all_day,
    description: row.description ?? undefined,
    project: row.project ?? undefined,
    projectId: row.project_id ?? undefined,
    task: row.task ?? undefined,
    // Серия — это строка с заполненным recurrence_rule. Разовое событие
    // отдаётся без поля recurrence вовсе, как и ожидает клиент.
    recurrence: row.recurrence_rule
      ? {
          rule: row.recurrence_rule,
          weekdays: row.recurrence_weekdays ?? [],
          until: row.recurrence_until ?? undefined,
        }
      : undefined,
    skippedDates: row.skipped_dates.length > 0 ? row.skipped_dates : undefined,
    seriesId: row.series_id ?? undefined,
  }
}

export interface CalendarEventInput {
  id?: string
  title: string
  date: string
  startTime: string
  endTime: string
  calendarId: string
  important: boolean
  allDay: boolean
  description?: string | null
  project?: string | null
  projectId?: string | null
  task?: string | null
  recurrence?: { rule: TaskRecurrenceRule; weekdays: number[]; until?: string | null } | null
  skippedDates?: string[] | null
  seriesId?: string | null
}

/** Разворачивает объект recurrence в три плоские колонки — соответствие
 * между вложенной формой API и плоской формой таблицы живёт только
 * здесь. */
function recurrenceColumns(input: CalendarEventInput) {
  return {
    rule: input.recurrence?.rule ?? null,
    weekdays: input.recurrence?.weekdays ?? null,
    until: input.recurrence?.until ?? null,
  }
}

const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  date: 'date',
  startTime: 'start_time',
  endTime: 'end_time',
  allDay: 'all_day',
  calendarId: 'calendar_id',
  important: 'important',
  project: 'project',
  projectId: 'project_id',
  task: 'task',
  seriesId: 'series_id',
} as const

export type CalendarEventPatch = Partial<Record<keyof typeof UPDATABLE_COLUMNS, unknown>> & {
  recurrence?: CalendarEventInput['recurrence']
  skippedDates?: string[] | null
}

export const calendarEventsRepository = {
  async findAllForUser(userId: string): Promise<CalendarEvent[]> {
    const { rows } = await query<CalendarEventRow>(
      'select * from calendar_events where user_id = $1 order by date asc, start_time asc',
      [userId],
    )
    return rows.map(toCalendarEvent)
  },

  /** Для проверки series_id перед вставкой — чтобы дать понятную 404
   * вместо сырой ошибки внешнего ключа (и не дать сослаться на чужую
   * серию, чего сам FK не проверяет). */
  async existsForUser(userId: string, eventId: string): Promise<boolean> {
    const { rows } = await query(
      'select id from calendar_events where id = $1 and user_id = $2',
      [eventId, userId],
    )
    return rows.length > 0
  },

  async create(userId: string, input: CalendarEventInput): Promise<CalendarEvent> {
    const recurrence = recurrenceColumns(input)
    const { rows } = await query<CalendarEventRow>(
      `insert into calendar_events
         (id, user_id, title, description, date, start_time, end_time, all_day,
          calendar_id, important, project, project_id, task,
          recurrence_rule, recurrence_weekdays, recurrence_until, skipped_dates, series_id)
       values (coalesce($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
               $14, $15, $16, coalesce($17::jsonb, '[]'::jsonb), $18)
       returning *`,
      [
        input.id ?? null,
        userId,
        input.title,
        input.description ?? null,
        input.date,
        input.startTime,
        input.endTime,
        input.allDay,
        input.calendarId,
        input.important,
        input.project ?? null,
        input.projectId ?? null,
        input.task ?? null,
        recurrence.rule,
        recurrence.weekdays,
        recurrence.until,
        input.skippedDates ? JSON.stringify(input.skippedDates) : null,
        input.seriesId ?? null,
      ],
    )
    return toCalendarEvent(rows[0])
  },

  async update(
    userId: string,
    eventId: string,
    patch: CalendarEventPatch,
  ): Promise<CalendarEvent | null> {
    const assignments: string[] = []
    const params: unknown[] = [eventId, userId]

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      const value = patch[key as keyof typeof UPDATABLE_COLUMNS]
      if (value === undefined) continue
      params.push(value)
      assignments.push(`${column} = $${params.length}`)
    }

    // recurrence приходит одним объектом, а лежит в трёх колонках, так
    // что обновляются они только вместе: частичное «поменяй weekdays, а
    // rule оставь» оставило бы серию в противоречивом состоянии.
    if (patch.recurrence !== undefined) {
      const recurrence = recurrenceColumns({ recurrence: patch.recurrence } as CalendarEventInput)
      params.push(recurrence.rule, recurrence.weekdays, recurrence.until)
      assignments.push(
        `recurrence_rule = $${params.length - 2}`,
        `recurrence_weekdays = $${params.length - 1}`,
        `recurrence_until = $${params.length}`,
      )
    }

    if (patch.skippedDates !== undefined) {
      params.push(JSON.stringify(patch.skippedDates ?? []))
      assignments.push(`skipped_dates = $${params.length}::jsonb`)
    }

    if (assignments.length === 0) {
      const { rows } = await query<CalendarEventRow>(
        'select * from calendar_events where id = $1 and user_id = $2',
        [eventId, userId],
      )
      return rows[0] ? toCalendarEvent(rows[0]) : null
    }

    const { rows } = await query<CalendarEventRow>(
      `update calendar_events set ${assignments.join(', ')}
       where id = $1 and user_id = $2
       returning *`,
      params,
    )
    return rows[0] ? toCalendarEvent(rows[0]) : null
  },

  /** Удаление серии уносит и её строки-переопределения: за это отвечает
   * `series_id ... on delete cascade` в схеме, отдельного запроса не
   * нужно. */
  async remove(userId: string, eventId: string): Promise<boolean> {
    const { rowCount } = await query(
      'delete from calendar_events where id = $1 and user_id = $2',
      [eventId, userId],
    )
    return (rowCount ?? 0) > 0
  },
}
