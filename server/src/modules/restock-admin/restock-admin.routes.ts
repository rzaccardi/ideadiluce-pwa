import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { restockAdminService } from './restock-admin.service.js'
import {
  restockAdminIdParamsSchema,
  restockAdminListQuerySchema,
  restockAdminPatchSchema,
} from './restock-admin.validators.js'

export const restockAdminRouter = Router()

restockAdminRouter.use(loadAdminSession, requireAdminAuth)

restockAdminRouter.get(
  '/',
  validateRequest({ query: restockAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = restockAdminListQuerySchema.parse(req.query)
    res.json(ok(await restockAdminService.list(query)))
  }),
)

restockAdminRouter.get(
  '/:id',
  validateRequest({ params: restockAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await restockAdminService.getById(req.params.id)))
  }),
)

restockAdminRouter.patch(
  '/:id',
  validateRequest({
    params: restockAdminIdParamsSchema,
    body: restockAdminPatchSchema,
  }),
  asyncHandler(async (req, res) => {
    const body = restockAdminPatchSchema.parse(req.body)
    res.json(ok(await restockAdminService.patch(req.params.id, body)))
  }),
)
