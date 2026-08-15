import { Router } from 'express'
import * as tasksController from '../controllers/tasks.controller'

export const tasksRouter = Router()

tasksRouter.get('/', tasksController.listTasks)
tasksRouter.post('/', tasksController.createTask)
/** Замена задачи целиком — восстановление из архива с прежним id. */
tasksRouter.put('/:id', tasksController.replaceTask)
tasksRouter.patch('/:id', tasksController.updateTask)
tasksRouter.delete('/:id', tasksController.deleteTask)

/** Разовый перенос локальных задач при первом входе — отдельным
 * маршрутом, а не POST / в цикле: сотня задач это сотня запросов и
 * гарантированный upload-лимит. */
tasksRouter.post('/import', tasksController.importTasks)
