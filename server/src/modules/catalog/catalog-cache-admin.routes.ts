import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { catalogCacheAdminService } from './catalog-cache-admin.service.js'

export const catalogCacheAdminRouter = Router()

catalogCacheAdminRouter.use(loadAdminSession, requireAdminAuth)

catalogCacheAdminRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(ok(await catalogCacheAdminService.getStatus()))
  }),
)

catalogCacheAdminRouter.post(
  '/sync',
  asyncHandler(async (_req, res) => {
    res.json(ok(await catalogCacheAdminService.startSync()))
  }),
)
