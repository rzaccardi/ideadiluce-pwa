import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { socialProofAdminService } from './social-proof-admin.service.js'
import { socialProofSettingsPatchSchema } from './social-proof-admin.validators.js'

export const socialProofAdminRouter = Router()

socialProofAdminRouter.use(loadAdminSession, requireAdminAuth)

socialProofAdminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json(ok(await socialProofAdminService.getSettings()))
  }),
)

socialProofAdminRouter.patch(
  '/settings',
  validateRequest({ body: socialProofSettingsPatchSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await socialProofAdminService.patchSettings(req.body)))
  }),
)

socialProofAdminRouter.post(
  '/sync-odoo',
  asyncHandler(async (req, res) => {
    const result = await socialProofAdminService.syncFromOdoo({
      correlationId: req.correlationId,
    })
    res.json(ok(result))
  }),
)
