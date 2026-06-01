import { Router } from 'express'
import type { z } from 'zod'
import { CarrierProvider, ShippingMethodType } from '@prisma/client'
import { requireAdminToken } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { shippingAdminService, seedDefaultShippingZones } from './shipping.admin.service.js'
import {
  credentialUpsertSchema,
  methodCreateSchema,
  methodUpdateSchema,
  simulateSchema,
  zoneCreateSchema,
  zoneUpdateSchema,
} from './shipping.admin.validators.js'

export const shippingAdminRouter = Router()
export { seedDefaultShippingZones }

shippingAdminRouter.use(requireAdminToken)

shippingAdminRouter.get(
  '/zones',
  asyncHandler(async (_req, res) => {
    res.json(ok(await shippingAdminService.listZones()))
  }),
)

shippingAdminRouter.post(
  '/zones',
  validateRequest({ body: zoneCreateSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(ok(await shippingAdminService.createZone(req.body)))
  }),
)

shippingAdminRouter.patch(
  '/zones/:id',
  validateRequest({ body: zoneUpdateSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await shippingAdminService.updateZone(req.params.id, req.body)))
  }),
)

shippingAdminRouter.delete(
  '/zones/:id',
  asyncHandler(async (req, res) => {
    res.json(ok(await shippingAdminService.deleteZone(req.params.id)))
  }),
)

shippingAdminRouter.post(
  '/zones/:zoneId/methods',
  validateRequest({ body: methodCreateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof methodCreateSchema>
    res.status(201).json(
      ok(
        await shippingAdminService.createMethod(req.params.zoneId, {
          ...body,
          type: body.type as ShippingMethodType,
        }),
      ),
    )
  }),
)

shippingAdminRouter.patch(
  '/methods/:id',
  validateRequest({ body: methodUpdateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof methodUpdateSchema>
    res.json(
      ok(
        await shippingAdminService.updateMethod(req.params.id, {
          ...body,
          type: body.type as ShippingMethodType | undefined,
        }),
      ),
    )
  }),
)

shippingAdminRouter.delete(
  '/methods/:id',
  asyncHandler(async (req, res) => {
    res.json(ok(await shippingAdminService.deleteMethod(req.params.id)))
  }),
)

shippingAdminRouter.get(
  '/credentials',
  asyncHandler(async (_req, res) => {
    res.json(ok(await shippingAdminService.listCredentials()))
  }),
)

shippingAdminRouter.put(
  '/credentials',
  validateRequest({ body: credentialUpsertSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof credentialUpsertSchema>
    res.json(
      ok(
        await shippingAdminService.upsertCredential({
          ...body,
          provider: body.provider as CarrierProvider,
        }),
      ),
    )
  }),
)

shippingAdminRouter.post(
  '/simulate',
  validateRequest({ body: simulateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof simulateSchema>
    res.json(ok(await shippingAdminService.simulate(req, body.shippingAddress)))
  }),
)
