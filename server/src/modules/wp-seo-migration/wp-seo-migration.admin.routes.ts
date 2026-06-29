import { Router } from 'express'
import { ok } from '../../lib/api-response.js'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { wpSeoMigrationService } from './wp-seo-migration.service.js'
import {
  wpMigrationRecordPatchBodySchema,
  wpMigrationRecordsListQuerySchema,
  wpMigrationRunsListQuerySchema,
} from './wp-seo-migration.validators.js'

export const wpSeoMigrationAdminRouter = Router()

wpSeoMigrationAdminRouter.use(loadAdminSession, requireAdminAuth)

wpSeoMigrationAdminRouter.get(
  '/runs',
  validateRequest({ query: wpMigrationRunsListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await wpSeoMigrationService.listRuns(req.query as never)
    res.json(ok(result))
  }),
)

wpSeoMigrationAdminRouter.get(
  '/runs/:runId',
  asyncHandler(async (req, res) => {
    const item = await wpSeoMigrationService.getRun(req.params.runId)
    res.json(ok(item))
  }),
)

wpSeoMigrationAdminRouter.get(
  '/runs/:runId/records',
  validateRequest({ query: wpMigrationRecordsListQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await wpSeoMigrationService.listRecords(req.params.runId, req.query as never)
    res.json(ok(result))
  }),
)

wpSeoMigrationAdminRouter.patch(
  '/runs/:runId/records/:recordId',
  validateRequest({ body: wpMigrationRecordPatchBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await wpSeoMigrationService.patchRecord(
      req.params.runId,
      req.params.recordId,
      req.body,
    )
    res.json(ok(item))
  }),
)
