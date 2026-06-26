import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { professionalRequestsAdminService } from './professional-requests-admin.service.js'
import {
  professionalRequestsAdminIdParamsSchema,
  professionalRequestsAdminListQuerySchema,
  professionalRequestsAdminPatchSchema,
  professionalRequestsAdminStatusSchema,
} from './professional-requests-admin.validators.js'

export const professionalRequestsAdminRouter = Router()

professionalRequestsAdminRouter.use(loadAdminSession, requireAdminAuth)

professionalRequestsAdminRouter.get(
  '/',
  validateRequest({ query: professionalRequestsAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = professionalRequestsAdminListQuerySchema.parse(req.query)
    res.json(ok(await professionalRequestsAdminService.list(query)))
  }),
)

professionalRequestsAdminRouter.get(
  '/:id',
  validateRequest({ params: professionalRequestsAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await professionalRequestsAdminService.getById(req.params.id)))
  }),
)

professionalRequestsAdminRouter.patch(
  '/:id/status',
  validateRequest({
    params: professionalRequestsAdminIdParamsSchema,
    body: professionalRequestsAdminStatusSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      ok(
        await professionalRequestsAdminService.updateStatus(req.params.id, req.body.status),
      ),
    )
  }),
)

professionalRequestsAdminRouter.patch(
  '/:id',
  validateRequest({
    params: professionalRequestsAdminIdParamsSchema,
    body: professionalRequestsAdminPatchSchema,
  }),
  asyncHandler(async (req, res) => {
    const body = professionalRequestsAdminPatchSchema.parse(req.body)
    res.json(ok(await professionalRequestsAdminService.patch(req.params.id, body)))
  }),
)
