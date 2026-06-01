import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { usersService } from '../modules/users/users.service.js'
import { asyncHandler } from '../utils/async-handler.js'

export const usersController = {
  patchMe: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as { firstName?: string; lastName?: string; phone?: string | null }
    const userId = req.sessionRecord!.user!.id
    const user = await usersService.patchMe(userId, body)
    res.json(ok({ user }))
  }),
}
