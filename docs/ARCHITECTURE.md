# Архитектура Planly

Карта текущего состояния кода (не путать с `01-PRD.md`…`06-COMPONENTS.md` — это продуктовое
видение на будущее, там есть папки/модули, которых в коде ещё нет).

## Стек

- Next.js 16 (App Router, Turbopack) — `next@^16.2.11`
- React 19, TypeScript (строгий режим)
- Tailwind CSS v4 (CSS-first конфиг, без `tailwind.config.js`)
- `lucide-react` — единственная доп. библиотека (иконки)
- Хранилище данных — только `localStorage` браузера. Нет БД, сервера, авторизации, реального AI.
- npm, `package-lock.json` в репозитории. `npm run dev` / `npm run build`.

## Основные уровни

- **Маршруты (`src/app/*/page.tsx`)** — `/` (Dashboard), `/calendar` (Calendar), `/projects`
  (Projects), `/notes` (Notes), `/reminders` (Reminders), `/analytics` (Analytics), `/settings`
  (Settings). Каждая страница — `"use client"`, сама собирает Sidebar + Header + модульные блоки.
- **`src/app/layout.tsx`** — корневой layout, монтирует ВСЮ цепочку глобальных провайдеров
  (см. «Потоки данных» ниже). Единственное место, где они монтируются.
- **Общие компоненты (`src/components/layout/`, `src/components/ui/`)** — `Sidebar.tsx` (общая
  навигация на всех страницах), `ui/DropdownMenu.tsx`, `ui/Avatar.tsx`, `ui/ComingSoonDialog.tsx`
  (заглушка-модалка для точечных нереализованных действий внутри Projects/Notes/Reminders/
  Analytics), `ui/Switch.tsx` (переключатель, используется в Settings).
- **Модульные компоненты (`src/components/<module>/`)** — `dashboard/`, `tasks/`, `calendar/`,
  `projects/`, `notes/`, `reminders/`, `analytics/`, `settings/`, `ai/`. Компонент модуля не
  должен напрямую импортировать внутренности другого модуля — общее выносится в `ui/` или `lib/`.
- **Stores (`src/hooks/use*Store.tsx`, `useTheme.tsx`, `useClock.tsx`)** — React Context +
  Provider, у каждого своя зона ответственности.
- **Types (`src/types/*.ts`)** — `task.ts`, `calendar.ts`, `notification.ts`, `project.ts`,
  `note.ts`, `reminder.ts`, `analytics.ts`, `settings.ts`.
- **Utilities (`src/lib/*.ts`)** — чистые функции: даты, парсинг, форматирование, mock-данные,
  фильтры (см. таблицу в MODULES.md для точных файлов по модулю).
- **Persistence** — `src/lib/storage.ts` + внутри каждого стора; ключи `planly:*` в
  `localStorage`.
- **Стили (`src/styles/globals.css`)** — Tailwind + кастомные keyframes для анимаций.

## Потоки данных

- **Задачи** — `useTasksStore()` — единственный источник; хранит в `localStorage`
  (`planly:tasks`, `planly:focus`). Dashboard читает напрямую.
- **Календарь** — `useCalendarStore()` — читает `useTasksStore()` изнутри (обязан быть вложен
  внутри `TasksProvider`); объединяет реальные события и задачи-с-датой в единую модель
  `CalendarEntry` (`lib/calendar-entries.ts`) вместо двух раздельных коллекций. Хранит
  `planly:calendars`, `planly:events`.
- **Проекты** — **без общего стора**: `app/projects/page.tsx` держит `useState<Project[]>`,
  инициализированный из `lib/projects-mock-data.ts`. Не пишет в `localStorage`. Это
  сознательно временный UI-скелет (см. MODULES.md → Projects).
- **Заметки** — **без общего стора**: `app/notes/page.tsx` держит `useState<Note[]>`,
  инициализированный из `lib/notes-mock-data.ts`. Не пишет в `localStorage`. UI-скелет (см.
  MODULES.md → Notes).
- **Напоминания** — **без общего стора**: `app/reminders/page.tsx` держит `useState<Reminder[]>`,
  инициализированный из `lib/reminders-mock-data.ts` (даты рассчитаны относительно реального
  `now`). Не пишет в `localStorage`, изолированы от `CalendarEntry`/`useTasksStore` — не
  отображаются в `/calendar` и не связаны с реальными задачами. UI-скелет (см. MODULES.md →
  Reminders).
- **Аналитика** — **без стора и без localStorage**: `app/analytics/page.tsx` использует
  mock-данные из `lib/analytics-mock-data.ts`, масштабируемые по периоду. UI-скелет (см.
  MODULES.md → Analytics).
- **Настройки** — **без общего стора**: `app/settings/page.tsx` держит модель `draft`/`saved` в
  `useState`, персистит в `localStorage` (`planly:settings`) при нажатии «Сохранить». Полностью
  рабочий раздел (в отличие от Projects/Notes/Reminders/Analytics), но пока не влияет на
  поведение других модулей — см. PROJECT_HANDOFF.md §4.
- **Уведомления** — `useNotificationsStore()` — читает и `useTasksStore()`, и
  `useCalendarStore()` (обязан быть вложен внутри обоих); ждёт `hydrated` от обоих перед первым
  диффом, чтобы не сгенерировать фейковые события при гидратации. Хранит `planly:notifications`.
- **Тема интерфейса** — `useTheme()` — персистится через `planly:settings.appearance.theme`:
  `themePreference` (`light`/`dark`/`system`) и `setThemePreference` читаются `ThemeProvider` при
  старте и применяются классом `dark` на `<html>` глобально, переживают перезагрузку. Прежний
  `toggleTheme` (используется в Sidebar/Header) не менялся.
- **localStorage** — единственные легитимные ключи: `planly:tasks`, `planly:focus`,
  `planly:calendars`, `planly:events`, `planly:notifications`, `planly:settings`. Новый ключ,
  скорее всего, ошибка дублирования данных — каждый Provider хранит только своё. Projects, Notes,
  Reminders, Analytics в `localStorage` намеренно не пишут (см. выше).

Дерево провайдеров в `layout.tsx` (порядок обязателен — каждый следующий физически зависит от
предыдущих):

```
ThemeProvider → ClockProvider → TasksProvider → CalendarProvider → NotificationsProvider
```

## Общие зависимости

Изменение этих файлов может затронуть несколько модулей — трогать осторожно:

- `src/app/layout.tsx` — порядок провайдеров.
- `src/hooks/useClock.tsx` — единый источник даты/времени для всего приложения; бизнес-логика
  не должна звать `new Date()` напрямую.
- `src/hooks/useTasksStore.tsx`, `useCalendarStore.tsx`, `useNotificationsStore.tsx` — цепочка
  взаимозависимостей между сторами.
- `src/lib/date-utils.ts` — единый набор утилит дат (`getLocalDateKey`/`fromISODate` и т.д.).
- `src/components/layout/Sidebar.tsx` — навигация на всех страницах.
- `src/components/dashboard/Header.tsx` — используется на Dashboard и Projects (с параметрами).
- `src/components/ui/*` — переиспользуемые примитивы.
- `src/lib/app-constants.ts`, `src/lib/utils.ts` — общие константы/хелперы.
- `src/styles/globals.css` — глобальные стили и анимации.

## Архитектурные ограничения

- Все Provider-стор монтируются глобально в `layout.tsx`, не на отдельных страницах — не
  разносить их по страницам.
- Локальную дату никогда не получать через `date.toISOString().slice(0,10)` (сдвигает день
  из-за UTC) — только `getLocalDateKey()`/`fromISODate()` из `lib/date-utils.ts`.
- `CalendarEntry` — единственная модель для отображения записей календаря; не заводить
  отдельную коллекцию/синхронизацию вместо мёржа на лету.
- Единственный путь редактирования сущности в календаре — `useCalendarStore().openEntryEditor()`
  — не добавлять второй путь.
- Не смешивать dev/build кэш Turbopack (`.next`) — при конфликте см. PROJECT_CONTEXT.md.
- Подробности решений и их причины — см. `PROJECT_CONTEXT.md`, разделы 10–11 (читать точечно,
  не целиком, если нужен только один пункт).
