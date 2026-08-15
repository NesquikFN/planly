# База данных Planly

Postgres, миграции — обычные пронумерованные SQL-файлы в `migrations/`.
Инструмента миграций нет специально: файлов немного, порядок задаётся
номером, и любой из них можно применить руками через `psql`.

Схема **не использует RLS**. Изоляцию данных между пользователями
обеспечивает backend: каждый репозиторий фильтрует по `user_id`, взятому
из сессии (`req.user.id`), и никогда из тела запроса. Прямого доступа к
базе с фронтенда нет — в этом основное отличие от прежней схемы на
Supabase.

## Применить миграции

Локально (через туннель к Railway):

```bash
railway connect Postgres --tunnel-only --port 15432
```

```bash
psql "postgres://postgres:PASSWORD@localhost:15432/railway" -f database/migrations/0001_init_schema.sql
```

На проде проще всего той же командой, но с публичным `DATABASE_URL` из
Railway → Postgres → Connect.

Все миграции идемпотентны (`create table if not exists`, `drop trigger if
exists` перед `create trigger`), так что повторный запуск безопасен.

## Файлы

| Файл | Что делает |
| --- | --- |
| `migrations/0001_init_schema.sql` | Начальная схема: `users`, `profiles`, `auth_tokens`, `tasks`, `calendar_events`, `rate_limit_hits` |

## legacy-supabase/

Прежние миграции Supabase — только для справки и переноса данных.
Приложение их больше не использует. Отличия новой схемы:

- `auth.users` → собственная таблица `users` с `password_hash`;
- политики RLS убраны, их роль выполняет backend;
- `profiles` создаётся в коде регистрации, а не триггером `handle_new_user`;
- добавлены `auth_tokens` (подтверждение почты, сброс пароля) и
  `rate_limit_hits` (лимиты запросов);
- у `tasks.priority` и `calendar_events.recurrence_rule` появились
  check-ограничения, у `calendar_events` — колонки `project`,
  `project_id`, `task`, которых в Supabase-версии не было, хотя в типе
  `CalendarEvent` они есть.
