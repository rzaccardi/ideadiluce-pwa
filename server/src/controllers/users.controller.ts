import type { Request, Response } from 'express'
import type { z } from 'zod'
import { ok } from '../lib/api-response.js'
import { usersService } from '../modules/users/users.service.js'
import { userShippingAddressesService } from '../modules/users/user-shipping-addresses.service.js'
import type { patchMeSchema } from '../modules/users/users.validators.js'
import type { upsertShippingAddressSchema } from '../modules/users/user-shipping-addresses.validators.js'
import { asyncHandler } from '../utils/async-handler.js'

type PatchMeBody = z.infer<typeof patchMeSchema>
type ShippingAddressBody = z.infer<typeof upsertShippingAddressSchema>

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

  listShippingAddresses: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    res.json(
      ok(
        await userShippingAddressesService.list(userId, {
          correlationId: req.correlationId,
          req,
        }),
      ),
    )
  }),

  createShippingAddress: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    res.status(201).json(
      ok(
        await userShippingAddressesService.create(userId, req.body as ShippingAddressBody, {
          correlationId: req.correlationId,
          req,
        }),
      ),
    )
  }),

  updateShippingAddress: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const addressId = String(req.params.id ?? '')
    res.json(
      ok(
        await userShippingAddressesService.update(
          userId,
          addressId,
          req.body as ShippingAddressBody,
          { correlationId: req.correlationId, req },
        ),
      ),
    )
  }),

  deleteShippingAddress: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const addressId = String(req.params.id ?? '')
    res.json(
      ok(
        await userShippingAddressesService.remove(userId, addressId, {
          correlationId: req.correlationId,
          req,
        }),
      ),
    )
  }),

  selectShippingAddress: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.sessionRecord!.user!.id
    const addressId = String(req.params.id ?? '')
    res.json(
      ok(
        await userShippingAddressesService.select(userId, addressId, {
          correlationId: req.correlationId,
          req,
        }),
      ),
    )
  }),
}
