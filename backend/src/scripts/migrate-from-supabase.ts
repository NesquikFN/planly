/**
 * Разовый перенос данных из Supabase в собственную базу Planly.
 *
 * Запуск:
 *   SUPABASE_DATABASE_URL=... TARGET_DATABASE_URL=... \
 *     npx tsx src/scripts/migrate-from-supabase.ts
 *
 * По умолчанию — сухой прогон: только читает и печатает, что сделал бы.
 * Записывать начнёт лишь с флагом --apply.
 *
 * SUPABASE_DATABASE_URL — строка подключения из Supabase → Project
 * Settings → Database → Connection string (не anon-ключ: нужен прямой
 * доступ к схеме auth, которую REST API не отдаёт).
 * TARGET_DATABASE_URL — публичный URL базы Railway.
 *
 * Скрипт идемпотентен: всё пишется через `on conflict do nothing`, id
 * сохраняются, поэтому повторный запуск ничего не задваивает и не
 * затирает изменения, сделанные уже в новом приложении. Ничего не
 * удаляет — ни в Supabase, ни в целевой базе.
 */
import pg from 'pg'
import { sslConfig } from '../utils/postgresSsl'

const APPLY = process.argv.includes('--apply')

const SOURCE_URL = process.env.SUPABASE_DATABASE_URL
const TARGET_URL = process.env.TARGET_DATABASE_URL

if (!SOURCE_URL || !TARGET_URL) {
  console.error('Нужны обе переменные: SUPABASE_DATABASE_URL и TARGET_DATABASE_URL.')
  process.exit(1)
}

// Даты переносятся как есть, строками: цель — точная копия, а прогон
// timestamp через Date рискует сдвигом на границе таймзон.
for (const oid of [1082, 1114, 1184, 1083]) {
  pg.types.setTypeParser(oid, (value: string) => value)
}

function connect(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, ssl: sslConfig(connectionString) })
}

const source = connect(SOURCE_URL)
const target = connect(TARGET_URL)

interface Report {
  table: string
  found: number
  inserted: number
  skipped: number
}

const report: Report[] = []

/**
 * Пользователи. Пароли переезжают как есть — bcrypt-строкой из
 * auth.users; backend умеет её проверять и молча пересчитает в scrypt
 * при первом входе (см. password.service). Поэтому никому не придётся
 * восстанавливать пароль.
 *
 * Берутся только строки с непустым паролем: аккаунты, заведённые через
 * OAuth-провайдера, паролем не обладают, и переносить их в схему, где
 * password_hash обязателен, нечем.
 */
async function migrateUsers(): Promise<void> {
  const { rows } = await source.query<{
    id: string
    email: string
    encrypted_password: string
    email_confirmed_at: string | null
    created_at: string
  }>(
    `select id, email, encrypted_password, email_confirmed_at, created_at
     from auth.users
     where deleted_at is null
       and email is not null
       and encrypted_password is not null
       and encrypted_password <> ''
     order by created_at asc`,
  )

  let inserted = 0
  for (const row of rows) {
    if (!APPLY) continue
    const result = await target.query(
      `insert into users (id, email, password_hash, email_verified_at, created_at)
       values ($1, $2, $3, $4, $5)
       -- Без указания колонки: уникален не только id, но и email, и
       -- перенос не должен падать, если такой адрес уже завёл кто-то
       -- в новом приложении.
       on conflict do nothing`,
      [row.id, row.email.trim().toLowerCase(), row.encrypted_password, row.email_confirmed_at, row.created_at],
    )
    inserted += result.rowCount ?? 0
  }

  report.push({ table: 'users', found: rows.length, inserted, skipped: rows.length - inserted })
}

/** Профили. Колонки совпадают один в один — схема 0001 намеренно
 * повторяет прежнюю public.profiles. */
async function migrateProfiles(): Promise<void> {
  const { rows } = await source.query<Record<string, string | null>>(
    `select id, email, full_name, first_name, last_name, display_name, phone,
            job_title, company, bio, avatar_url, timezone, language,
            created_at, updated_at
     from public.profiles`,
  )

  let inserted = 0
  for (const row of rows) {
    if (!APPLY) continue
    const result = await target.query(
      `insert into profiles (id, email, full_name, first_name, last_name, display_name, phone,
                             job_title, company, bio, avatar_url, timezone, language,
                             created_at, updated_at)
       select $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              coalesce($12, 'Europe/Tbilisi'), coalesce($13, 'ru'), $14, $15
       -- Профиль без пользователя вставить нельзя (внешний ключ), а
       -- упасть на одной осиротевшей строке посреди переноса — плохой
       -- размен. Такие строки просто пропускаются и видны в отчёте.
       where exists (select 1 from users where users.id = $1)
       on conflict do nothing`,
      [
        row.id, row.email, row.full_name, row.first_name, row.last_name, row.display_name,
        row.phone, row.job_title, row.company, row.bio, row.avatar_url, row.timezone,
        row.language, row.created_at, row.updated_at,
      ],
    )
    inserted += result.rowCount ?? 0
  }

  report.push({ table: 'profiles', found: rows.length, inserted, skipped: rows.length - inserted })
}

async function migrateTasks(): Promise<void> {
  const { rows } = await source.query<Record<string, unknown>>(
    `select id, user_id, title, due_label, priority, completed, important,
            date, time, completed_at, recurrence, created_at, updated_at
     from public.tasks`,
  )

  let inserted = 0
  for (const row of rows) {
    if (!APPLY) continue
    const result = await target.query(
      `insert into tasks (id, user_id, title, due_label, priority, completed, important,
                          date, time, completed_at, recurrence, created_at, updated_at)
       select $1, $2, $3, coalesce($4, ''),
              -- Проверка приоритета в новой схеме строже, чем была в
              -- Supabase (там колонка принимала любой текст). Всё
              -- незнакомое приводим к 'none', иначе перенос упрётся в
              -- constraint на одной старой строке.
              case when $5 in ('overdue', 'important', 'upcoming', 'none') then $5 else 'none' end,
              coalesce($6, false), coalesce($7, false), $8, $9, $10, $11, $12, $13
       where exists (select 1 from users where users.id = $2)
       on conflict do nothing`,
      [
        row.id, row.user_id, row.title, row.due_label, row.priority, row.completed,
        row.important, row.date, row.time, row.completed_at,
        row.recurrence === null ? null : JSON.stringify(row.recurrence),
        row.created_at, row.updated_at,
      ],
    )
    inserted += result.rowCount ?? 0
  }

  report.push({ table: 'tasks', found: rows.length, inserted, skipped: rows.length - inserted })
}

/**
 * События календаря. Таблица в Supabase была создана, но приложение к
 * ней так и не подключилось, поэтому обычно она пуста — перенос всё
 * равно делается, на случай если строки там всё-таки появились.
 *
 * Порядок важен: строка-переопределение ссылается на свою серию
 * (series_id), поэтому серии вставляются первыми.
 */
async function migrateCalendarEvents(): Promise<void> {
  const { rows } = await source.query<Record<string, unknown>>(
    `select id, user_id, title, description, date, start_time, end_time, all_day,
            calendar_id, important, timezone, recurrence_rule, recurrence_weekdays,
            recurrence_until, skipped_dates, series_id, created_at, updated_at
     from public.calendar_events
     order by (series_id is not null), created_at`,
  )

  let inserted = 0
  for (const row of rows) {
    if (!APPLY) continue
    const result = await target.query(
      `insert into calendar_events (id, user_id, title, description, date, start_time, end_time,
                                    all_day, calendar_id, important, timezone,
                                    recurrence_rule, recurrence_weekdays, recurrence_until,
                                    skipped_dates, series_id, created_at, updated_at)
       select $1, $2, $3, $4, $5, $6, $7, coalesce($8, false), coalesce($9, 'personal'),
              coalesce($10, false), coalesce($11, 'UTC'),
              case when $12 in ('none', 'daily', 'weekdays', 'weekly', 'custom') then $12 else null end,
              $13, $14, coalesce($15::jsonb, '[]'::jsonb), $16, $17, $18
       where exists (select 1 from users where users.id = $2)
       on conflict do nothing`,
      [
        row.id, row.user_id, row.title, row.description, row.date, row.start_time, row.end_time,
        row.all_day, row.calendar_id, row.important, row.timezone, row.recurrence_rule,
        row.recurrence_weekdays, row.recurrence_until,
        row.skipped_dates === null ? null : JSON.stringify(row.skipped_dates),
        row.series_id, row.created_at, row.updated_at,
      ],
    )
    inserted += result.rowCount ?? 0
  }

  report.push({
    table: 'calendar_events',
    found: rows.length,
    inserted,
    skipped: rows.length - inserted,
  })
}

async function main(): Promise<void> {
  console.log(APPLY ? '=== ПЕРЕНОС (запись включена) ===' : '=== СУХОЙ ПРОГОН (ничего не пишется) ===')

  // Строго в этом порядке: профили и задачи ссылаются на users.
  await migrateUsers()
  await migrateProfiles()
  await migrateTasks()
  await migrateCalendarEvents()

  console.log('')
  console.log('таблица           найдено  перенесено  пропущено')
  for (const line of report) {
    // В сухом прогоне никто ничего не вставлял, поэтому «перенесено» и
    // «пропущено» показывать нечем — прочерк честнее нулей, которые
    // читались бы как «ничего не перенеслось».
    const inserted = APPLY ? String(line.inserted) : '—'
    const skipped = APPLY ? String(line.skipped) : '—'
    console.log(
      `${line.table.padEnd(17)} ${String(line.found).padStart(7)} ${inserted.padStart(11)} ${skipped.padStart(10)}`,
    )
  }

  if (!APPLY) {
    console.log('')
    console.log('Это был сухой прогон. Повторите с флагом --apply, чтобы перенести данные.')
  }
}

main()
  .catch((error: unknown) => {
    console.error('Перенос прерван:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await source.end()
    await target.end()
  })
