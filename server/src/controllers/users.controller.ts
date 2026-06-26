import type { Request, Response } from 'express'
import type { z } from 'zod'
import { ok } from '../lib/api-response.js'
import { usersService } from '../modules/users/users.service.js'
import type { patchMeSchema } from '../modules/users/users.validators.js'
import { asyncHandler } from '../utils/async-handler.js'

type PatchMeBody = z.infer<typeof patchMeSchema>

export const usersController = {
  patchMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const result = await usersService.patchMe(userId, req.body as PatchMeBody, {
      correlationId: req.correlationId,
      req,
    })
    res.json(ok(result))
  }),

  patchBusiness: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const result = await usersService.patchBusiness(userId, req.body, {
      correlationId: req.correlationId,
      req,
    })
    res.json(ok(result))
  }),

  myProfessionalRequest: asyncHandler(async (req: Request, res: Response) => {
    const user = req.sessionRecord!.user!
    res.json(
      ok(await usersService.getMyProfessionalRequest(user.id, user.email)),
    )
  }),
}
