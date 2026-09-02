import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { uptimeAdminService } from './uptime-admin.service.js'

export const uptimeAdminRouter = Router()

uptimeAdminRouter.use(loadAdminSession, requireAdminAuth)

uptimeAdminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(ok(await uptimeAdminService.getOverview()))
  }),
)

uptimeAdminRouter.post(
  '/ensure',
  asyncHandler(async (_req, res) => {
    res.json(ok(await uptimeAdminService.ensureRecommended()))
  }),
)
