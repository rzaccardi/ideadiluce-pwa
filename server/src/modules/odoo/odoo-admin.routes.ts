import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { AppError } from '../../types/errors.js'
import { odooAdminService } from './odoo-admin.service.js'
import {
  odooAdminListQuerySchema,
  odooAdminPricelistAssignmentSchema,
  odooAdminPricelistQuerySchema,
  odooAdminQuotationIdParamsSchema,
  odooSyncQueueIdParamsSchema,
  odooSyncQueueListQuerySchema,
} from './odoo-admin.validators.js'

export const odooAdminRouter = Router()

odooAdminRouter.use(loadAdminSession, requireAdminAuth)

odooAdminRouter.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json(ok(await odooAdminService.getStatus(req)))
  }),
)

odooAdminRouter.get(
  '/orders',
  validateRequest({ query: odooAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = odooAdminListQuerySchema.parse(req.query)
    res.json(ok(await odooAdminService.listOrders(query, req)))
  }),
)

odooAdminRouter.get(
  '/quotations',
  validateRequest({ query: odooAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = odooAdminListQuerySchema.parse(req.query)
    res.json(ok(await odooAdminService.listQuotations(query, req)))
  }),
)

odooAdminRouter.get(
  '/quotations/:id',
  validateRequest({ params: odooAdminQuotationIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = odooAdminQuotationIdParamsSchema.parse(req.params)
    const detail = await odooAdminService.getQuotationDetail(id, req)
    if (!detail) {
      throw new AppError('QUOTATION_NOT_FOUND', 'Quotation not found', 'Preventivo non trovato.', 404, false)
    }
    res.json(ok(detail))
  }),
)

odooAdminRouter.get(
  '/pricelists',
  validateRequest({ query: odooAdminPricelistQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = odooAdminPricelistQuerySchema.parse(req.query)
    res.json(ok(await odooAdminService.listPricelists(query, req)))
  }),
)

odooAdminRouter.post(
  '/pricelist-assignments',
  validateRequest({ body: odooAdminPricelistAssignmentSchema }),
  asyncHandler(async (req, res) => {
    const body = odooAdminPricelistAssignmentSchema.parse(req.body)
    res.status(201).json(ok(await odooAdminService.assignPricelist(body, req)))
  }),
)

odooAdminRouter.get(
  '/sync-queue',
  validateRequest({ query: odooSyncQueueListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = odooSyncQueueListQuerySchema.parse(req.query)
    res.json(ok(await odooAdminService.listSyncQueue(query)))
  }),
)

odooAdminRouter.post(
  '/sync-queue/:id/retry',
  validateRequest({ params: odooSyncQueueIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = odooSyncQueueIdParamsSchema.parse(req.params)
    res.json(ok(await odooAdminService.retrySyncQueueItem(id, req)))
  }),
)
