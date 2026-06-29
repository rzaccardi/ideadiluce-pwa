import { Router } from 'express'
import { ok } from '../../lib/api-response.js'
import { requireIntegrationsToken } from '../../middlewares/require-integrations-token.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { wpSeoMigrationService } from './wp-seo-migration.service.js'
import {
  wpMigrationBatchBodySchema,
  wpMigrationCompleteBodySchema,
  wpMigrationCreateRunBodySchema,
  wpMigrationProgressBodySchema,
} from './wp-seo-migration.validators.js'

export const wpSeoMigrationIngestRouter = Router()

wpSeoMigrationIngestRouter.use(requireIntegrationsToken)

wpSeoMigrationIngestRouter.post(
  '/runs',
  validateRequest({ body: wpMigrationCreateRunBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await wpSeoMigrationService.createRun(req.body)
    res.status(201).json(ok(item))
  }),
)

wpSeoMigrationIngestRouter.post(
  '/runs/:runId/batches',
  validateRequest({ body: wpMigrationBatchBodySchema }),
  asyncHandler(async (req, res) => {
    const result = await wpSeoMigrationService.ingestBatch(req.params.runId, req.body)
    res.json(ok(result))
  }),
)

wpSeoMigrationIngestRouter.post(
  '/runs/:runId/progress',
  validateRequest({ body: wpMigrationProgressBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await wpSeoMigrationService.updateProgress(req.params.runId, req.body)
    res.json(ok(item))
  }),
)

wpSeoMigrationIngestRouter.post(
  '/runs/:runId/complete',
  validateRequest({ body: wpMigrationCompleteBodySchema }),
  asyncHandler(async (req, res) => {
    const item = await wpSeoMigrationService.completeRun(req.params.runId, req.body)
    res.json(ok(item))
  }),
)
