import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { siteInquiriesAdminService } from './site-inquiries-admin.service.js'
import {
  siteInquiriesAdminIdParamsSchema,
  siteInquiriesAdminListQuerySchema,
  siteInquiriesAdminPatchSchema,
} from './site-inquiries-admin.validators.js'

export const siteInquiriesAdminRouter = Router()

siteInquiriesAdminRouter.use(loadAdminSession, requireAdminAuth)

siteInquiriesAdminRouter.get(
  '/',
  validateRequest({ query: siteInquiriesAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = siteInquiriesAdminListQuerySchema.parse(req.query)
    res.json(ok(await siteInquiriesAdminService.list(query)))
  }),
)

siteInquiriesAdminRouter.get(
  '/:id',
  validateRequest({ params: siteInquiriesAdminIdParamsSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await siteInquiriesAdminService.getById(req.params.id)))
  }),
)

siteInquiriesAdminRouter.patch(
  '/:id',
  validateRequest({
    params: siteInquiriesAdminIdParamsSchema,
    body: siteInquiriesAdminPatchSchema,
  }),
  asyncHandler(async (req, res) => {
    const body = siteInquiriesAdminPatchSchema.parse(req.body)
    res.json(ok(await siteInquiriesAdminService.patch(req.params.id, body)))
  }),
)
