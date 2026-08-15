# Planly

Персональный планировщик: задачи, календарь, заметки, проекты, напоминания.

Монорепо на npm workspaces:

| Папка | Что это |
| --- | --- |
| `frontend/` | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| `backend/` | Express 5 + TypeScript + Postgres (`pg`, без ORM) |
| `database/` | SQL-миграции; `legacy-supabase/` — прежняя схема, только для справки |
| `docs/` | Продуктовые документы и карта архитектуры |

## Архитектура

Фронтенд не ходит в базу напрямую — только в API бэкенда. Бэкенд разложен
слоями `routes → controllers → services → repositories`: маршруты знают
только про пути и middleware, контроллеры валидируют вход схемами Zod,
сервисы держат правила, репозитории — единственное место с SQL и с
преобразованием snake_case ↔ camelCase.

Сессия — подписанный HMAC токен в httpOnly-куке. В базе сессии не
хранятся; `user_id` для каждого запроса берётся из сессии и никогда из
тела запроса. RLS в схеме нет — изоляцию данных обеспечивает backend.

В облаке живут профиль, задачи и события календаря. Остальные модули
(заметки, проекты, напоминания, архив, сообщество) по-прежнему работают на
`localStorage`.

## Запуск

```bash
npm install
```

Поднять Postgres и применить миграции — см. [database/README.md](database/README.md).

Переменные среды: скопировать `backend/.env.example` → `backend/.env` и
`frontend/.env.example` → `frontend/.env.local`, заполнить `DATABASE_URL` и
`JWT_SECRET` (`openssl rand -hex 32`).

Два процесса в разных терминалах:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Фронтенд — на `http://localhost:3000`, API — на `http://localhost:4000`.

## Проверки

```bash
npm run typecheck --workspace=backend && npm run lint --workspace=backend && npm test --workspace=backend
```

```bash
npm run build --workspace=frontend
```

## Деплой на Railway

Два сервиса из одного репозитория плюс Postgres:

- **backend** — `backend/Dockerfile`, контекст сборки — корень репозитория.
  Переменные: `DATABASE_URL` (ссылкой на Postgres), `JWT_SECRET`,
  `FRONTEND_URL` (публичный домен фронтенда), `NODE_ENV=production`.
- **frontend** — `frontend/Dockerfile`, контекст тоже корень.
  Переменные: `NEXT_PUBLIC_API_URL` (публичный домен бэкенда),
  `NEXT_PUBLIC_SESSION_COOKIE_NAME`.

`NEXT_PUBLIC_*` вшиваются в бандл при сборке, поэтому после смены домена
фронтенд нужно пересобрать, а не просто перезапустить.

Домены у сервисов разные, значит связка кросс-доменная: при
`NODE_ENV=production` кука сессии выставляется как `SameSite=None; Secure`,
а CORS разрешает ровно один origin — `FRONTEND_URL`.
