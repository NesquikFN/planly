-- Planly — migration 0001: начальная схема собственного бэкенда.
--
-- Заменяет Supabase (см. database/legacy-supabase/ — прежние миграции
-- оставлены только для справки и переноса данных). Ключевое отличие: нет
-- ни `auth.users`, ни RLS. Пользователи живут в обычной таблице `users`,
-- а изоляцию данных обеспечивает backend — каждый репозиторий фильтрует и
-- проставляет user_id из сессии, никогда из тела запроса.
--
-- Изменения схемы добавляйте новыми файлами 0002_*.sql и т.д., а не
-- правкой этого файла задним числом.

-- Нужно для gen_random_uuid().
create extension if not exists pgcrypto;

-- =========================================================
-- Общий триггер updated_at
-- =========================================================
-- Одна функция на все таблицы: она не зависит от конкретных колонок,
-- кроме updated_at, который есть везде, где он нужен. В Supabase-версии
-- на каждую таблицу заводилась своя копия (handle_tasks_updated_at,
-- handle_calendar_events_updated_at) — дублирование без причины.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Таблица users — учётные данные
-- =========================================================
-- Только то, что нужно для входа. Всё, что показывается в интерфейсе,
-- лежит в profiles: так строка с password_hash читается ровно там, где
-- проверяется пароль, и не попадает случайно в ответы API вместе с
-- профилем.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  -- Приводится к нижнему регистру в auth.service до записи, поэтому
  -- обычный unique-индекс здесь эквивалентен регистронезависимому и не
  -- требует citext.
  email text not null,
  password_hash text not null,
  -- null = почта ещё не подтверждена. Само по себе не блокирует вход
  -- (см. env REQUIRE_EMAIL_VERIFICATION) — это решение принимает backend.
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_key unique (email)
);

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

-- =========================================================
-- Таблица profiles — 1:1 с users
-- =========================================================
-- Набор колонок повторяет прежнюю public.profiles из Supabase
-- (legacy-supabase/migrations/001, 002), чтобы фронтенд и перенос данных
-- не требовали переименований. Строка создаётся вместе с пользователем в
-- одной транзакции (auth.service), поэтому триггера-провижнинга, как в
-- Supabase (handle_new_user), здесь нет — незачем прятать это в БД.
create table if not exists profiles (
  id uuid primary key references users (id) on delete cascade,
  email text,
  full_name text,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  job_title text,
  company text,
  bio text,
  avatar_url text,
  timezone text not null default 'Europe/Tbilisi',
  language text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- =========================================================
-- Таблица auth_tokens — подтверждение почты и сброс пароля
-- =========================================================
-- Хранится только sha256-хеш токена: утечка дампа БД не должна давать
-- возможность войти по чужой ссылке восстановления. Сам токен существует
-- ровно один раз — в письме.
create table if not exists auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null,
  purpose text not null,
  expires_at timestamptz not null,
  -- Одноразовость: проставляется при успешном использовании, повторный
  -- переход по той же ссылке уже не сработает.
  used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint auth_tokens_token_hash_key unique (token_hash),
  constraint auth_tokens_purpose_check
    check (purpose in ('email_verification', 'password_reset'))
);

create index if not exists auth_tokens_user_id_purpose_idx
  on auth_tokens (user_id, purpose);

-- =========================================================
-- Таблица tasks
-- =========================================================
-- Колонки повторяют тип Task (frontend/src/types/task.ts) один в один:
-- ни description, ни status, ни project_id — этих полей в приложении нет.
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  due_label text not null default '',
  priority text not null default 'none',
  completed boolean not null default false,
  important boolean not null default false,
  date date,
  time time,
  completed_at timestamptz,
  -- Устаревшее поле (см. Task.recurrence): новые задачи его не пишут,
  -- повторяющиеся сущности живут в calendar_events. Колонка оставлена,
  -- чтобы старые задачи не теряли данные при переносе.
  recurrence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- В Supabase-версии проверки не было, и в БД мог оказаться любой текст.
  -- Список ровно повторяет TaskPriority; валидация Zod на входе даёт
  -- понятную 400, а это — последний рубеж на случай ошибки в коде.
  constraint tasks_priority_check
    check (priority in ('overdue', 'important', 'upcoming', 'none'))
);

create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists tasks_user_id_priority_idx on tasks (user_id, priority);
create index if not exists tasks_user_id_date_idx on tasks (user_id, date);

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- =========================================================
-- Таблица calendar_events
-- =========================================================
-- Повторяющаяся серия — это ОДНА строка с recurrence_*; отдельные
-- вхождения никогда не материализуются, а вычисляются при чтении
-- (frontend/src/lib/calendar-recurrence.ts). skipped_dates хранит
-- исключения («пропустить/удалить это вхождение») простым массивом
-- дат-ключей, series_id — переопределение одного конкретного вхождения.
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  start_time time not null,
  end_time time not null,
  all_day boolean not null default false,
  calendar_id text not null default 'personal',
  important boolean not null default false,
  timezone text not null default 'UTC',

  -- Свободные текстовые связи с проектом/задачей: в приложении это
  -- подписи, а не внешние ключи (см. CalendarEvent.project/task).
  project text,
  project_id text,
  task text,

  -- Повторение — null rule = обычное разовое событие.
  recurrence_rule text,
  recurrence_weekdays int[],
  recurrence_until date,

  skipped_dates jsonb not null default '[]'::jsonb,

  -- Заполнено только у строки-переопределения: какую серию (id этой же
  -- таблицы) она подменяет на одну дату. У самой серии здесь null.
  series_id uuid references calendar_events (id) on delete cascade,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint calendar_events_time_order check (end_time > start_time),
  constraint calendar_events_recurrence_rule_check
    check (recurrence_rule is null
           or recurrence_rule in ('none', 'daily', 'weekdays', 'weekly', 'custom')),
  -- Строка-переопределение сама серией быть не может: иначе развернуть
  -- календарь корректно было бы невозможно.
  constraint calendar_events_override_not_series
    check (series_id is null or recurrence_rule is null)
);

create index if not exists calendar_events_user_id_idx on calendar_events (user_id);
create index if not exists calendar_events_user_id_date_idx on calendar_events (user_id, date);
create index if not exists calendar_events_series_id_idx
  on calendar_events (series_id) where series_id is not null;

drop trigger if exists calendar_events_set_updated_at on calendar_events;
create trigger calendar_events_set_updated_at
  before update on calendar_events
  for each row execute function set_updated_at();

-- =========================================================
-- Таблица rate_limit_hits — счётчики лимитов запросов
-- =========================================================
-- Нужна там, где лимит обязан пережить перезапуск процесса: счётчик в
-- памяти обнулялся бы каждым деплоем сразу всем пользователям.
create table if not exists rate_limit_hits (
  key text primary key,
  hits integer not null default 0,
  expires_at timestamptz not null
);

create index if not exists rate_limit_hits_expires_at_idx on rate_limit_hits (expires_at);
