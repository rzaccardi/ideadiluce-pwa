import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { ordersAdminService } from './orders-admin.service.js'
import {
  ordersAdminIdParamsSchema,
  ordersAdminListQuerySchema,
  ordersAdminStatsQuerySchema,
} from './orders-admin.validators.js'

import { paidSyncAlertService } from './paid-sync-alert.service.js'

export const ordersAdminRouter = Router()

ordersAdminRouter.use(loadAdminSession, requireAdminAuth)

ordersAdminRouter.get(
  '/stats',
  validateRequest({ query: ordersAdminStatsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { days } = ordersAdminStatsQuerySchema.parse(req.query)
    res.json(ok(await ordersAdminService.getStats(days)))
  }),
)

ordersAdminRouter.get(
  '/paid-sync-pending',
  asyncHandler(async (_req, res) => {
    res.json(ok(await paidSyncAlertService.listPendingForAdmin()))
  }),
)

ordersAdminRouter.get(
  '/',
  validateRequest({ query: ordersAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = ordersAdminListQuerySchema.parse(req.query)
    res.json(ok(await ordersAdminService.listOrders(query, req)))
  }),
)

ordersAdminRouter.get(
  '/:id',
  validateRequest({ params: ordersAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await ordersAdminService.getOrder(req.params.id, req)))
  }),
)

ordersAdminRouter.post(
  '/:id/retry-sync',
  validateRequest({ params: ordersAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await ordersAdminService.retryOrderSync(req.params.id, req)))
  }),
)
