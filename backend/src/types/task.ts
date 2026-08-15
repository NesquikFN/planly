// Повторяет frontend/src/types/task.ts. Специально не вынесено в общий
// пакет: у backend и frontend разные жизненные циклы, а дублирование
// одного маленького типа дешевле общего workspace-пакета, который
// пришлось бы собирать перед каждым запуском.

export type TaskPriority = 'overdue' | 'important' | 'upcoming' | 'none'

export type TaskRecurrenceRule = 'none' | 'daily' | 'weekdays' | 'weekly' | 'custom'

export interface TaskRecurrence {
  rule: TaskRecurrenceRule
  weekdays: number[]
  time?: string
}

export interface Task {
  id: string
  title: string
  dueLabel: string
  priority: TaskPriority
  completed: boolean
  important: boolean
  date?: string
  time?: string
  completedAt?: string
  createdAt?: string
  /** Устаревшее поле: новые задачи его не пишут, но старые могут иметь. */
  recurrence?: TaskRecurrence
}
