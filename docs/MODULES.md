# Модули Planly

Таблица реальных модулей в текущем коде. Все 7 разделов (Dashboard, Calendar, Projects, Notes,
Reminders, Analytics, Settings) имеют страницы и реализованы: Dashboard/Calendar/Settings —
полностью рабочие с `localStorage`; Projects/Notes/Reminders/Analytics — интерактивные
UI-скелеты на mock-данных, без `localStorage` (статус — см. таблицу). Модуля «Привычки» (Habits)
в проекте нет вообще.

| Модуль | Маршрут | Главный файл | Компоненты | Store | Types | Статус |
|---|---|---|---|---|---|---|
| Dashboard | `/` | `src/app/page.tsx` | `components/dashboard/*` | `useTasksStore`, `useCalendarStore` (для TodayCalendarCard), `useNotificationsStore` (для Header) | `types/task.ts` | работает |
| Tasks | `/` (внутри Dashboard) | `components/dashboard/TaskListCard.tsx` | `components/tasks/*` | `useTasksStore` | `types/task.ts` | работает |
| Calendar | `/calendar` | `src/app/calendar/page.tsx` | `components/calendar/*` | `useCalendarStore` (+ читает `useTasksStore`) | `types/calendar.ts` | работает |
| Projects | `/projects` | `src/app/projects/page.tsx` | `components/projects/*` | нет (локальный `useState`, mock-данные) | `types/project.ts` | UI-скелет, без `localStorage` |
| Notes | `/notes` | `src/app/notes/page.tsx` | `components/notes/*` | нет (локальный `useState`, mock-данные) | `types/note.ts` | UI-скелет, без `localStorage` |
| Reminders | `/reminders` | `src/app/reminders/page.tsx` | `components/reminders/*` | нет (локальный `useState`, mock-данные) | `types/reminder.ts` | UI-скелет, без `localStorage` |
| Analytics | `/analytics` | `src/app/analytics/page.tsx` | `components/analytics/*` | нет (mock-данные) | `types/analytics.ts` | UI-скелет, без `localStorage` |
| Settings | `/settings` | `src/app/settings/page.tsx` | `components/settings/*` | нет (локальный `useState` draft/saved) + `localStorage` (`planly:settings`) | `types/settings.ts` | работает |
| Notifications | — (панель в Header) | `components/dashboard/NotificationsPanel.tsx` | — | `useNotificationsStore` (+ читает Tasks и Calendar) | `types/notification.ts` | работает |
| Theme | — (переключатель в Sidebar/Settings) | `hooks/useTheme.tsx` | — | `useTheme` (персистится через `planly:settings`) | — | работает |
| Sidebar | общий для всех страниц | `components/layout/Sidebar.tsx` | `ui/Avatar.tsx`, `ui/ComingSoonDialog.tsx` | `useTasksStore` (setView), `useTheme` | — | работает |

---

## Dashboard

Читать в первую очередь:
- `src/app/page.tsx`
- `src/components/dashboard/Header.tsx`, `StatsRow.tsx`, `TaskListCard.tsx`, `FocusCard.tsx`,
  `ProgressCard.tsx`, `TodayCalendarCard.tsx`, `NotificationsPanel.tsx`

Прямые зависимости:
- `src/hooks/useTasksStore.tsx`, `src/hooks/useCalendarStore.tsx`, `src/hooks/useClock.tsx`
- `src/lib/focus.ts`, `src/lib/weekly-progress.ts`, `src/lib/mock-data.ts`, `src/lib/filters.ts`
- `src/components/ai/BottomInput.tsx`, `src/components/tasks/*` (модалка/тост задач)
- `src/types/task.ts`

Не нужно читать для локальных изменений: Calendar-специфичные компоненты (`components/calendar/*`
кроме `TodayCalendarCard`), Projects.

## Tasks

Читать в первую очередь:
- `src/components/tasks/TaskRow.tsx`, `TaskEditModal.tsx`, `CompletedTaskToast.tsx`,
  `CompletedTasksList.tsx`
- `src/hooks/useTasksStore.tsx`

Прямые зависимости:
- `src/lib/task-parser.ts`, `src/lib/task-date.ts`, `src/lib/date-utils.ts`, `src/lib/priority.ts`,
  `src/lib/filters.ts`, `src/lib/storage.ts`
- `src/types/task.ts`

Не нужно читать для локальных изменений: Calendar UI, Projects, Notifications.

## Calendar

Читать в первую очередь:
- `src/app/calendar/page.tsx`
- `src/hooks/useCalendarStore.tsx`
- `src/components/calendar/*` (только конкретные вью/компоненты, относящиеся к задаче — их много,
  не открывать все сразу: например, для правки Month-вида достаточно `MonthView.tsx` +
  `EventBlock.tsx` + стор, не нужны `WeekView.tsx`/`DayView.tsx`/`AgendaView.tsx`)

Прямые зависимости:
- `src/lib/calendar-entries.ts`, `calendar-colors.ts`, `calendar-constants.ts`, `calendar-time.ts`,
  `calendar-filters.ts`, `calendar-mock-data.ts`, `calendar-button-styles.ts`, `date-utils.ts`
- `src/hooks/useTasksStore.tsx` (Calendar читает задачи изнутри), `useSwipeNavigation.ts`
- `src/types/calendar.ts`

Не нужно читать для локальных изменений: Dashboard-специфичные карточки (кроме
`TodayCalendarCard`, если задача про интеграцию), Projects.

## Projects

Читать в первую очередь:
- `src/app/projects/page.tsx`
- `src/components/projects/ProjectCard.tsx`, `ProjectsGrid.tsx`, `ProjectsToolbar.tsx`,
  `ProjectsStatsRow.tsx`, `ProjectsSidePanel.tsx`, `ProjectsArchiveCard.tsx`

Прямые зависимости:
- `src/lib/projects-mock-data.ts`
- `src/types/project.ts`
- `src/components/ui/ComingSoonDialog.tsx` (все нереализованные действия открывают эту модалку)
- `src/components/dashboard/Header.tsx`, `src/components/layout/Sidebar.tsx` (общая обвязка
  страницы)

Не нужно читать для локальных изменений: Calendar, Tasks-специфичную логику стора, Notifications.
Модуль пока не имеет стора и localStorage — не добавлять их без явного запроса пользователя.

## Notifications

Читать в первую очередь:
- `src/components/dashboard/NotificationsPanel.tsx`
- `src/hooks/useNotificationsStore.tsx`

Прямые зависимости:
- `src/hooks/useTasksStore.tsx`, `src/hooks/useCalendarStore.tsx` (стор читает оба)
- `src/lib/notifications.ts`
- `src/types/notification.ts`

Не нужно читать для локальных изменений: внутренности Calendar-вью, Projects.

## Theme

Читать в первую очередь:
- `src/hooks/useTheme.tsx`

Прямые зависимости:
- `src/app/layout.tsx` (монтирование `ThemeProvider`)
- `src/components/layout/Sidebar.tsx` (переключатель темы)
- `src/styles/globals.css` (dark-варианты стилей — точечно, не читать целиком)

Не нужно читать для локальных изменений: stores задач/календаря/уведомлений, если тема не влияет
на их логику.

## Sidebar

Читать в первую очередь:
- `src/components/layout/Sidebar.tsx`

Прямые зависимости:
- `src/hooks/useTasksStore.tsx` (только `setView`), `src/hooks/useTheme.tsx`
- `src/components/ui/Avatar.tsx`, `ui/ComingSoonDialog.tsx`
- `src/lib/app-constants.ts` (`USER_NAME`), `src/lib/utils.ts` (`cn`)

Не нужно читать для локальных изменений: содержимое страниц-модулей, если меняется только сам
пункт меню/навигация.

## Notes

Читать в первую очередь:
- `src/app/notes/page.tsx`
- `src/components/notes/*` (список с фильтрами по папкам/тегам, редактор — секции, чек-листы,
  вложения, связи с проектом/задачей/событием)

Прямые зависимости:
- `src/lib/notes-mock-data.ts`
- `src/types/note.ts`
- `src/components/layout/Sidebar.tsx` (проп `notesExtras` — панель папок/тегов, рендерится
  только на `/notes`)

Не нужно читать для локальных изменений: Calendar, Reminders/Analytics/Settings-специфичную
логику. Модуль пока не имеет стора и `localStorage` (UI-скелет) — не добавлять их без явного
запроса пользователя.

## Reminders

Читать в первую очередь:
- `src/app/reminders/page.tsx`
- `src/components/reminders/*` (группировка по времени — Просроченные/Сегодня/Завтра/На
  неделе/Позже, список, режим «Расписание», меню «Отложить», мини-календарь)

Прямые зависимости:
- `src/lib/reminders-mock-data.ts`, `src/lib/reminders.ts` (пересчёт даты/времени при snooze)
- `src/types/reminder.ts`
- `src/components/layout/Sidebar.tsx` (проп `remindersExtras`, по аналогии с `notesExtras`)

Не нужно читать для локальных изменений: `useCalendarStore`/`useTasksStore` — Reminders
изолированы от реальной модели `CalendarEntry` и от настоящих задач, работают только с
собственными mock-данными (не отображаются в `/calendar`). Модуль пока не имеет стора и
`localStorage` (UI-скелет) — не добавлять их без явного запроса пользователя.

## Analytics

Читать в первую очередь:
- `src/app/analytics/page.tsx`
- `src/components/analytics/*` (индекс продуктивности, карточки метрик, графики/heatmap — все
  на ручном SVG/CSS, без библиотек графиков)

Прямые зависимости:
- `src/lib/analytics-mock-data.ts`
- `src/types/analytics.ts`

Не нужно читать для локальных изменений: Dashboard/Calendar/Projects/Notes/Reminders-специфичную
логику. Модуль на mock-данных, без стора и `localStorage` (UI-скелет) — не добавлять их без
явного запроса пользователя.

## Settings

Читать в первую очередь:
- `src/app/settings/page.tsx`
- `src/components/settings/*` (12 категорий, единая модель `draft`/`saved`)

Прямые зависимости:
- `src/lib/settings-defaults.ts`, `src/lib/settings-form-styles.ts`
- `src/types/settings.ts`
- `src/components/ui/Switch.tsx`
- `src/hooks/useTheme.tsx` (расширен аддитивно: `themePreference`/`setThemePreference`; читает
  `planly:settings.appearance.theme` при старте `ThemeProvider` — применяется глобально, не
  только на `/settings`)

Не нужно читать для локальных изменений: Dashboard/Calendar/Projects/Notes/Reminders/
Analytics-специфичную логику, если задача не про интеграцию их дефолтов с Settings (сейчас не
подключено — см. PROJECT_HANDOFF.md §4).
