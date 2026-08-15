import type { Request, Response } from 'express'
import * as usersService from '../services/users.service'
import { updateProfileSchema } from '../validation/profile.schemas'

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user, profile: await usersService.getProfile(req.user.id) })
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const patch = updateProfileSchema.parse(req.body)
  res.json({ user: req.user, profile: await usersService.updateProfile(req.user.id, patch) })
}
