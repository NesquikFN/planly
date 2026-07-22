# 04. Database — Planly

Документ описывает модель данных на концептуальном уровне: сущности и связи. Конкретная СУБД и ORM выбираются на этапе Phase 0 (см. [02-ROADMAP.md](02-ROADMAP.md)) и не фиксируются здесь заранее, чтобы не привязывать архитектуру к решению, принятому вручную позже.

## 1. Принципы модели данных

1. **Всё связано через общую сущность пользователя/пространства** — Tasks, Notes, Projects, Calendar принадлежат `Workspace`/`User`.
2. **Явные связи, а не дублирование** — заметка ссылается на задачу по id, а не копирует её данные.
3. **Мягкое удаление (soft delete)** для пользовательского контента — данные не исчезают безвозвратно при случайном удалении.
4. **Расширяемость** — модель проектируется так, чтобы Phase 4 (командная работа) не потребовала переписывания сущностей Phase 1.

## 2. Основные сущности

### User
Учётная запись пользователя.
- id, email, name, avatarUrl, createdAt, updatedAt

### Workspace
Рабочее пространство (личное или командное — задел на Phase 4).
- id, name, ownerId, createdAt

### WorkspaceMember
Связь пользователя с пространством и его роль (задел на командную работу).
- id, workspaceId, userId, role, joinedAt

### Task
- id, workspaceId, title, description, status, priority, dueDate, projectId (nullable), createdBy, createdAt, updatedAt, completedAt

### Note
- id, workspaceId, title, content, projectId (nullable), createdBy, createdAt, updatedAt

### Project
- id, workspaceId, name, description, status, createdBy, createdAt, updatedAt

### CalendarEvent
- id, workspaceId, title, startAt, endAt, relatedTaskId (nullable), createdBy, createdAt

### AIConversation / AIMessage
История взаимодействия с AI-ассистентом (см. [05-AI.md](05-AI.md)).
- AIConversation: id, workspaceId, userId, title, createdAt
- AIMessage: id, conversationId, role, content, createdAt

## 3. Ключевые связи

- `Workspace` 1—N `Task`, `Note`, `Project`, `CalendarEvent`
- `Project` 1—N `Task`, `Note` (опционально — задача/заметка может не принадлежать проекту)
- `Task` 1—0..1 `CalendarEvent` (задача может отображаться как событие календаря)
- `User` 1—N `AIConversation`

## 4. Индексация и производительность

- Индексы по `workspaceId` на всех основных таблицах (основной паттерн доступа — "все данные пространства").
- Индекс по `dueDate` для Task (частые выборки "задачи на сегодня/неделю").
- Полнотекстовый поиск по `Note.content` и `Task.title/description` — реализация зависит от выбранной СУБД.

## 5. Миграции

- Схема управляется миграциями (инструмент выбирается вместе со стеком).
- Каждое изменение схемы — отдельная миграция с обратимым откатом там, где это возможно.
- Миграции, ломающие обратную совместимость API, согласуются отдельно.

## 6. Не входит в текущий охват

- Физический выбор СУБД, ORM и точные типы полей — фиксируется в отдельном техническом решении при старте Phase 1.
- Шардирование и мультирегиональность — рассматриваются только при реальном росте нагрузки.

## 7. Связанные документы

- [01-PRD.md](01-PRD.md) — продуктовый смысл сущностей
- [05-AI.md](05-AI.md) — хранение AI-контекста
- [02-ROADMAP.md](02-ROADMAP.md) — когда какие сущности появляются
