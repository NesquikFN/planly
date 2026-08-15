import type { Request, Response } from 'express'
import * as tasksService from '../services/tasks.service'
import {
  createTaskSchema,
  importTasksSchema,
  replaceTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from '../validation/task.schemas'
import type { TaskPatch } from '../repositories/tasks.repository'

export async function listTasks(req: Request, res: Response): Promise<void> {
  res.json({ tasks: await tasksService.listTasks(req.user.id) })
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const input = createTaskSchema.parse(req.body)
  const task = await tasksService.createTask(req.user.id, {
    ...input,
    date: input.date ?? undefined,
    time: input.time ?? undefined,
    completedAt: input.completedAt ?? undefined,
    recurrence: input.recurrence ?? undefined,
  })
  res.status(201).json({ task })
}

export async function replaceTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamSchema.parse(req.params)
  const input = replaceTaskSchema.parse(req.body)
  const task = await tasksService.replaceTask(req.user.id, {
    ...input,
    id,
    date: input.date ?? undefined,
    time: input.time ?? undefined,
    completedAt: input.completedAt ?? undefined,
    recurrence: input.recurrence ?? undefined,
  })
  res.json({ task })
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamSchema.parse(req.params)
  // Zod уже отсеял неизвестные ключи, поэтому в репозиторий уходит ровно
  // то, что клиент прислал, — а он умеет отличать «не пришло» от «пришло
  // null» (снять дату — это null, а не отсутствие поля).
  const patch = updateTaskSchema.parse(req.body) as TaskPatch
  res.json({ task: await tasksService.updateTask(req.user.id, id, patch) })
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const { id } = taskIdParamSchema.parse(req.params)
  await tasksService.deleteTask(req.user.id, id)
  res.status(204).end()
}

export async function importTasks(req: Request, res: Response): Promise<void> {
  const { tasks } = importTasksSchema.parse(req.body)
  res.json(
    await tasksService.importTasks(
      req.user.id,
      tasks.map((task) => ({
        ...task,
        date: task.date ?? undefined,
        time: task.time ?? undefined,
        completedAt: task.completedAt ?? undefined,
        recurrence: task.recurrence ?? undefined,
      })),
    ),
  )
}
