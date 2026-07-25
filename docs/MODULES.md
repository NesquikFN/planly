# Модули Planly

Таблица реальных модулей в текущем коде. «Заметки», «Напоминания», «Аналитика», «Настройки» —
только пункты меню в Sidebar (открывают `ComingSoonDialog`, страниц нет). Модуля «Привычки»
(Habits) в проекте нет вообще.

| Модуль | Маршрут | Главный файл | Компоненты | Store | Types | Статус |
|---|---|---|---|---|---|---|
| Dashboard | `/` | `src/app/page.tsx` | `components/dashboard/*` | `useTasksStore`, `useCalendarStore` (для TodayCalendarCard), `useNotificationsStore` (для Header) | `types/task.ts` | работает |
| Tasks | `/` (внутри Dashboard) | `components/dashboard/TaskListCard.tsx` | `components/tasks/*` | `useTasksStore` | `types/task.ts` | работает |
| Calendar | `/calendar` | `src/app/calendar/page.tsx` | `components/calendar/*` | `useCalendarStore` (+ читает `useTasksStore`) | `types/calendar.ts` | работает |
| Projects | `/projects` | `src/app/projects/page.tsx` | `components/projects/*` | нет (локальный `useState`, mock-данные) | `types/project.ts` | UI-скелет |
| Notifications | — (панель в Header) | `components/dashboard/NotificationsPanel.tsx` | — | `useNotificationsStore` (+ читает Tasks и Calendar) | `types/notification.ts` | работает |
| Theme | — (переключатель в Sidebar) | `hooks/useTheme.tsx` | — | `useTheme` (не персистится) | — | работает |
| Sidebar | общий для всех страниц | `components/layout/Sidebar.tsx` | `ui/Avatar.tsx`, `ui/ComingSoonDialog.tsx` | `useTasksStore` (setView), `useTheme` | — | работает |
| Notes (Заметки) | нет страницы | пункт меню в Sidebar | — | — | — | отсутствует |
| Reminders (Напоминания) | нет страницы | пункт меню в Sidebar | — | — | — | отсутствует |
| Analytics (Аналитика) | нет страницы | пункт меню в Sidebar | — | — | — | отсутствует |
| Settings (Настройки) | нет страницы | пункт меню в Sidebar (secondary) | — | — | — | отсутствует |

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

## Notes / Reminders / Analytics / Settings (не реализованы)

Читать в первую очередь:
- `src/components/layout/Sidebar.tsx` (пункт меню + `ComingSoonDialog`)

Не нужно читать для локальных изменений: всё остальное — модулей физически нет, при задаче
«создать страницу X» ориентироваться на структуру Projects (`app/projects/page.tsx`) как на
ближайший пример UI-скелета.
