# План переноса рабочих данных в Supabase

Статус на сегодня: аутентификация и `public.profiles` — в Supabase (см.
`supabase/migrations/001_create_profiles.sql`, `002_extend_profiles.sql`). Задачи, проекты,
заметки, календарь, напоминания, архив и сообщество всё ещё хранятся только в `localStorage`
этого устройства (изолированы по `user.id`, см. `src/lib/storage.ts`). Этот документ — порядок
переноса каждой сущности в Supabase на следующем этапе. Сам перенос в рамках текущей задачи не
выполняется.

Общее для всех таблиц ниже:

- `user_id uuid not null references auth.users(id) on delete cascade`.
- RLS включён, политики `select/insert/update/delete` — только `auth.uid() = user_id`.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
  + триггер обновления `updated_at`, по образцу `handle_profile_updated_at()` из 001.
- Миграция localStorage → Supabase выполняется один раз на пользователя (флаг наподобие
  `planly:migrated:<entity>:<userId>`), без перезаписи уже существующих облачных записей.
- Offline cache: до появления настоящей синхронизации данные остаются читаемыми оффлайн, так как
  localStorage — основной источник до первой успешной записи в Supabase; после переноса
  локальная копия используется как read-through кэш последнего успешного состояния.
- Conflict resolution на первом этапе — "last write wins" по `updated_at` (одно устройство активно
  редактирует за раз); настоящий multi-device merge не рассматривается, пока не появится второе
  синхронизированное устройство в реальном использовании.

## 1. Tasks

- Таблица: `public.tasks`.
- `user_id`: обязателен.
- RLS: own-row only.
- Timestamps: `created_at`, `updated_at`, плюс существующие доменные поля (`due_date` и т.д. — без
  изменений схемы `types/task.ts`).
- Миграция: разовый bulk-insert текущего `planly:tasks` (per-user scoped) в Supabase при первом
  входе после включения фичи.
- Offline cache: localStorage продолжает быть немедленным источником отображения; фоновая запись в
  Supabase после каждого изменения.
- Conflict resolution: last write wins по `updated_at`.

## 2. Projects и project_tasks

- Таблицы: `public.projects`, `public.project_tasks` (или `task_id` + `project_id` FK, если задачи
  уже перенесены).
- `user_id`: на `projects` обязателен; `project_tasks` наследует доступ через `project_id`.
- RLS: own-row only на `projects`; `project_tasks` — политика через `exists (select 1 from
  projects where projects.id = project_id and projects.user_id = auth.uid())`.
- Timestamps: стандартные.
- Миграция: bulk-insert `planly:projects` разово, с сохранением связей на существующие `tasks`.
- Offline cache: как у Tasks.
- Conflict resolution: last write wins по `updated_at`.

## 3. Notes

- Таблица: `public.notes`.
- `user_id`: обязателен.
- RLS: own-row only.
- Timestamps: стандартные, плюс `pinned_at`/`archived_at`, если понадобятся (см. `types/note.ts`).
- Миграция: bulk-insert `planly:notes`; вложения (сейчас data URL) — см. §8 Files.
- Offline cache: как у Tasks.
- Conflict resolution: last write wins по `updated_at`.

## 4. Calendar events

- Таблица: `public.calendar_events`.
- `user_id`: обязателен.
- RLS: own-row only.
- Timestamps: стандартные, плюс доменные `start_at`/`end_at` (без изменений `types/calendar.ts`).
- Миграция: bulk-insert `planly:calendar`.
- Offline cache: как у Tasks — критично для страницы `/calendar`, которая должна открываться
  мгновенно.
- Conflict resolution: last write wins по `updated_at`.

## 5. Reminders

- Таблица: `public.reminders`.
- `user_id`: обязателен.
- RLS: own-row only.
- Timestamps: стандартные.
- Миграция: bulk-insert текущих mock/локальных напоминаний, если к моменту переноса они уже на
  `localStorage` (см. `PROJECT_HANDOFF.md` — сейчас Reminders на mock-данных без persistence,
  этот шаг предполагает, что localStorage для них появится раньше переноса в Supabase).
- Offline cache: как у Tasks.
- Conflict resolution: last write wins по `updated_at`.

## 6. Archive

- Таблица: `public.archive_items`.
- `user_id`: обязателен.
- RLS: own-row only.
- Timestamps: `archived_at` вместо/вместе с `created_at`.
- Миграция: bulk-insert `planly:archive`.
- Offline cache: как у Tasks.
- Conflict resolution: last write wins по `updated_at`.

## 7. Community

- Таблицы: `public.community_posts`, `public.community_comments` (или аналогично текущей модели
  `useCommunityStore`).
- `user_id`: автор поста/комментария.
- RLS: `select` — всем аутентифицированным пользователям (публичная лента); `insert/update/delete`
  — только автору (`auth.uid() = user_id`).
- Timestamps: стандартные.
- Миграция: в отличие от остальных сущностей, Community — общий, а не приватный контент; локальные
  demo-посты текущего пользователя переносятся как есть, без слияния с чужими.
- Offline cache: последняя загруженная лента остаётся видимой до восстановления сети.
- Conflict resolution: last write wins по `updated_at` на уровне отдельного поста/комментария.

## 8. Files

- Таблица метаданных: `public.files` (`user_id`, `entity_type`, `entity_id`, `storage_path`,
  `size`, `mime_type`).
- Бинарные данные — Supabase Storage bucket (не `profiles.avatar_url`-стиль data URL), приватный
  bucket с RLS-политикой на путь `user_id/...`.
- RLS: own-row only на таблице метаданных и на объектах bucket.
- Timestamps: стандартные.
- Миграция: конвертация уже сохранённых data URL (заметки/аватар/вложения) в объекты Storage,
  запись метаданных, замена data URL в соответствующих записях на `storage_path`.
- Offline cache: не кэшируется целиком — превью/thumbnail может кэшироваться, оригинал грузится по
  требованию.
- Conflict resolution: файлы неизменяемы после загрузки — конфликтов версий нет, только конфликт
  метаданных (last write wins).

## Порядок

1. Tasks — самая используемая сущность, наибольшая польза от переноса первой.
2. Projects/project_tasks — зависят от Tasks.
3. Notes.
4. Calendar events.
5. Reminders.
6. Archive.
7. Community.
8. Files — в последнюю очередь, так как требует Supabase Storage, а не только таблиц.

## Recurring tasks → calendar event series

Схема `public.calendar_events` (`supabase/migrations/004_create_calendar_events.sql`) подготовлена заранее — она нужна архитектурно (повторение теперь свойство события календаря, а не задачи, см. `EventRecurrence` в `types/calendar.ts`), но сам Calendar пока **не подключён** к Supabase: `useCalendarStore` по-прежнему работает на `localStorage`, как и раньше. Миграцию самого Calendar-хранилища в облако делать в порядке выше (пункт 4), отдельной задачей.

Что уже сделано в коде: `Task.recurrence` — legacy-поле, из него больше не создаются новые задачи (`toggleComplete` не порождает next occurrence), но само поле и колонка `tasks` не удаляются — старые данные остаются читаемыми. Пользователь может вручную конвертировать старую повторяющуюся задачу в серию календаря через диалог в `TaskEditModal` (при попытке задать повторение задаче).

Безопасный план для **массовой** миграции оставшихся старых `tasks.recurrence != none`:

1. Прогнать `supabase/reports/recurring-tasks-report.sql` (read-only) — узнать, сколько таких задач и у кого.
2. Показать пользователю/владельцу аккаунта список перед любыми изменениями.
3. Для каждой записи создать одну строку в `calendar_events` (rule/weekdays переносятся как есть, `date`/`time` задачи → `date`/`start_time`).
4. Не удалять исходные `tasks` автоматически — пометить как заархивированные (`reason: "migrated"` в Archive, по аналогии с `reason: "deleted"`) и оставить доступными для отмены.
5. Удаление колонки `tasks.recurrence` — отдельная миграция, только после того как ни одна активная запись её не использует, и только по явному подтверждению.

Инструмент для шага 3 (batch-конвертация) не реализован в этой задаче — только read-only отчёт и one-at-a-time конвертация через UI.
