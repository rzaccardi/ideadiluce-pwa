import rateLimit from 'express-rate-limit'
import { Router } from 'express'
import { loadOrCreateSession } from '../../middlewares/session.js'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import {
  catalogSearchEventBodySchema,
  searchAnalyticsListQuerySchema,
  searchAnalyticsStatsQuerySchema,
  searchHintsOdooApplySchema,
  searchHintsOdooQuerySchema,
} from './catalog-search-events.validators.js'
import {
  catalogSearchEventsService,
  searchAnalyticsAdminService,
} from './catalog-search-events.service.js'
import { searchHintsAdminService } from './search-hints-admin.service.js'

const ingestLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'SEARCH_EVENT_RATE_LIMIT',
      message: 'Too many search events',
      userMessage: 'Troppe richieste di tracciamento.',
      retriable: true,
    },
  },
})

export const searchRouter = Router()

searchRouter.post(
  '/events',
  ingestLimiter,
  loadOrCreateSession,
  validateRequest({ body: catalogSearchEventBodySchema }),
  asyncHandler(async (req, res) => {
    const body = catalogSearchEventBodySchema.parse(req.body)
    res.status(202).json(ok(await catalogSearchEventsService.record(req, body)))
  }),
)

export const searchAnalyticsAdminRouter = Router()

searchAnalyticsAdminRouter.use(loadAdminSession, requireAdminAuth)

searchAnalyticsAdminRouter.get(
  '/stats',
  validateRequest({ query: searchAnalyticsStatsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { days, locale } = searchAnalyticsStatsQuerySchema.parse(req.query)
    res.json(ok(await searchAnalyticsAdminService.getStats(days, locale)))
  }),
)

searchAnalyticsAdminRouter.get(
  '/',
  validateRequest({ query: searchAnalyticsListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = searchAnalyticsListQuerySchema.parse(req.query)
    res.json(ok(await searchAnalyticsAdminService.list(query)))
  }),
)

searchAnalyticsAdminRouter.get(
  '/odoo-hints',
  validateRequest({ query: searchHintsOdooQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = searchHintsOdooQuerySchema.parse(req.query)
    res.json(
      ok(
        await searchHintsAdminService.previewFromOdoo(
          { correlationId: req.correlationId },
          query,
        ),
      ),
    )
  }),
)

searchAnalyticsAdminRouter.post(
  '/apply-odoo-hints',
  validateRequest({ body: searchHintsOdooApplySchema }),
  asyncHandler(async (req, res) => {
    const body = searchHintsOdooApplySchema.parse(req.body)
    res.json(
      ok(
        await searchHintsAdminService.applyFromOdoo(
          { correlationId: req.correlationId },
          body,
        ),
      ),
    )
  }),
)
