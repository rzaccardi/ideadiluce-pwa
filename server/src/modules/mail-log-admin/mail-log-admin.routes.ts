import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { mailLogAdminService } from './mail-log-admin.service.js'
import {
  mailLogAdminIdParamsSchema,
  mailLogAdminListQuerySchema,
} from './mail-log-admin.validators.js'

export const mailLogAdminRouter = Router()

mailLogAdminRouter.use(loadAdminSession, requireAdminAuth)

mailLogAdminRouter.get(
  '/',
  validateRequest({ query: mailLogAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = mailLogAdminListQuerySchema.parse(req.query)
    res.json(ok(await mailLogAdminService.list(query, req)))
  }),
)

mailLogAdminRouter.get(
  '/:id',
  validateRequest({ params: mailLogAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = mailLogAdminIdParamsSchema.parse(req.params)
    res.json(ok(await mailLogAdminService.getById(id, req)))
  }),
)
