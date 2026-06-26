import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { abandonedCartsAdminService } from './abandoned-carts-admin.service.js'
import {
  abandonedCartsAdminIdParamsSchema,
  abandonedCartsAdminListQuerySchema,
} from './abandoned-carts-admin.validators.js'

export const abandonedCartsAdminRouter = Router()

abandonedCartsAdminRouter.use(loadAdminSession, requireAdminAuth)

abandonedCartsAdminRouter.get(
  '/',
  validateRequest({ query: abandonedCartsAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = abandonedCartsAdminListQuerySchema.parse(req.query)
    res.json(ok(await abandonedCartsAdminService.list(query)))
  }),
)

abandonedCartsAdminRouter.get(
  '/:id',
  validateRequest({ params: abandonedCartsAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await abandonedCartsAdminService.getById(req.params.id)))
  }),
)
