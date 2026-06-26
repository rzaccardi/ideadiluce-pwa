import { Router } from 'express'
import type { z } from 'zod'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { taxRepository } from './tax.repository.js'
import { taxRuleCreateSchema, taxRuleUpdateSchema } from './tax.validators.js'

function mapRule(row: Awaited<ReturnType<typeof taxRepository.findById>>) {
  if (!row) return null
  return {
    id: row.id,
    priority: row.priority,
    customerSegment: row.customerSegment,
    isProfessional: row.isProfessional,
    billingCountry: row.billingCountry,
    shippingCountry: row.shippingCountry,
    vatValid: row.vatValid,
    taxRatePct: Number(row.taxRatePct),
    taxLabel: row.taxLabel,
    disclaimerKey: row.disclaimerKey,
    odooFiscalPositionId: row.odooFiscalPositionId,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export const taxAdminRouter = Router()
export { seedDefaultTaxRules } from './tax.service.js'

taxAdminRouter.use(loadAdminSession, requireAdminAuth)

taxAdminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await taxRepository.listAll()
    res.json(ok(rows.map((r) => mapRule(r)!)))
  }),
)

taxAdminRouter.post(
  '/',
  validateRequest({ body: taxRuleCreateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof taxRuleCreateSchema>
    const row = await taxRepository.create(body)
    res.status(201).json(ok(mapRule(row)))
  }),
)

taxAdminRouter.patch(
  '/:id',
  validateRequest({ body: taxRuleUpdateSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof taxRuleUpdateSchema>
    const row = await taxRepository.update(req.params.id, body)
    res.json(ok(mapRule(row)))
  }),
)

taxAdminRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await taxRepository.delete(req.params.id)
    res.json(ok({ deleted: true }))
  }),
)
