import type { Request, Response } from 'express'
import { query } from '../config/db'

/** Проверяет и связь с БД, а не только «процесс жив»: без базы сервис
 * бесполезен, и healthcheck должен это показывать. */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    await query('select 1')
    res.json({ status: 'ok', database: 'ok' })
  } catch (error) {
    console.error('Healthcheck: база недоступна:', error)
    res.status(503).json({ status: 'degraded', database: 'unavailable' })
  }
}
