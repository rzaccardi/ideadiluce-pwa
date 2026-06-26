import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { documentDownloadsAdminService } from './document-downloads-admin.service.js'
import { documentDownloadsListQuerySchema } from './document-downloads-admin.validators.js'

export const documentDownloadsAdminRouter = Router()

documentDownloadsAdminRouter.use(loadAdminSession, requireAdminAuth)

documentDownloadsAdminRouter.get(
  '/',
  validateRequest({ query: documentDownloadsListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = documentDownloadsListQuerySchema.parse(req.query)
    res.json(ok(await documentDownloadsAdminService.list(query)))
  }),
)
