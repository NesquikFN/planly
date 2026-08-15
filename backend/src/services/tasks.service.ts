import { tasksRepository, type TaskPatch } from '../repositories/tasks.repository'
import { AppError } from '../utils/AppError'
import type { Task } from '../types/task'

export async function listTasks(userId: string): Promise<Task[]> {
  return tasksRepository.findAllForUser(userId)
}

export async function createTask(
  userId: string,
  input: Omit<Task, 'id'> & { id?: string },
): Promise<Task> {
  return tasksRepository.create(userId, input)
}

/** Восстановление задачи из архива: id сохраняется, повторный вызов
 * безопасен. */
export async function replaceTask(userId: string, task: Task): Promise<Task> {
  const replaced = await tasksRepository.upsert(userId, task)
  // null означает, что строка с таким id есть, но принадлежит другому
  // пользователю — снаружи это неотличимо от «нет такой задачи».
  if (!replaced) {
    throw new AppError(404, 'TASK_NOT_FOUND', 'Задача не найдена')
  }
  return replaced
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: TaskPatch,
): Promise<Task> {
  const task = await tasksRepository.update(userId, taskId, patch)
  // null здесь означает и «нет такой задачи», и «задача чужая» — намеренно
  // одинаково: по коду ответа нельзя выяснить, существует ли чужая задача.
  if (!task) {
    throw new AppError(404, 'TASK_NOT_FOUND', 'Задача не найдена')
  }
  return task
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const deleted = await tasksRepository.remove(userId, taskId)
  if (!deleted) {
    throw new AppError(404, 'TASK_NOT_FOUND', 'Задача не найдена')
  }
}

/** Разовый перенос локальных задач в облако при первом входе. */
export async function importTasks(userId: string, tasks: Task[]): Promise<{ imported: number }> {
  return { imported: await tasksRepository.insertMissing(userId, tasks) }
}
