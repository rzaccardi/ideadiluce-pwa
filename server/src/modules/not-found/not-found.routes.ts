import rateLimit from 'express-rate-limit'
import { Router } from 'express'
import { loadOrCreateSession } from '../../middlewares/session.js'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { ok } from '../../lib/api-response.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import {
  notFoundAdminHitsQuerySchema,
  notFoundAdminListQuerySchema,
  notFoundAdminStatsQuerySchema,
  notFoundEventBodySchema,
} from './not-found.validators.js'
import { notFoundAdminService, notFoundEventsService } from './not-found.service.js'

const ingestLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'NOT_FOUND_EVENT_RATE_LIMIT',
      message: 'Too many not-found events',
      userMessage: 'Troppe richieste di tracciamento.',
      retriable: true,
    },
  },
})

export const notFoundRouter = Router()

notFoundRouter.post(
  '/events',
  ingestLimiter,
  loadOrCreateSession,
  validateRequest({ body: notFoundEventBodySchema }),
  asyncHandler(async (req, res) => {
    const body = notFoundEventBodySchema.parse(req.body)
    res.status(202).json(ok(await notFoundEventsService.record(req, body)))
  }),
)

export const notFoundAdminRouter = Router()

notFoundAdminRouter.use(loadAdminSession, requireAdminAuth)

notFoundAdminRouter.get(
  '/stats',
  validateRequest({ query: notFoundAdminStatsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { days, hideBots, hideProbes } = notFoundAdminStatsQuerySchema.parse(req.query)
    res.json(ok(await notFoundAdminService.getStats(days, hideBots, hideProbes)))
  }),
)

notFoundAdminRouter.get(
  '/hits',
  validateRequest({ query: notFoundAdminHitsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = notFoundAdminHitsQuerySchema.parse(req.query)
    res.json(ok(await notFoundAdminService.listHits(query)))
  }),
)

notFoundAdminRouter.get(
  '/',
  validateRequest({ query: notFoundAdminListQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = notFoundAdminListQuerySchema.parse(req.query)
    res.json(ok(await notFoundAdminService.list(query)))
  }),
)
