import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { integrationLogsAdminService } from './integration-logs-admin.service.js'
import { integrationLogsListQuerySchema } from './integration-logs-admin.validators.js'

export const integrationLogsAdminRouter = Router()

integrationLogsAdminRouter.use(loadAdminSession, requireAdminAuth)

integrationLogsAdminRouter.get(
  '/',
  validateRequest({ query: integrationLogsListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = integrationLogsListQuerySchema.parse(req.query)
    res.json(ok(await integrationLogsAdminService.list(query)))
  }),
)
