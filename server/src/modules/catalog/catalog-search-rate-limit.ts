import rateLimit from 'express-rate-limit'
import type { Request, Response, NextFunction } from 'express'
import { env } from '../../config/env.js'
import { isCatalogSearchQueryPresent } from './catalog-search-guard.js'

const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: env.NODE_ENV === 'production' ? 60 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'CATALOG_SEARCH_RATE_LIMIT',
      message: 'Troppe ricerche in poco tempo. Riprova tra qualche secondo.',
      userMessage: 'Troppe ricerche in poco tempo. Riprova tra qualche secondo.',
      retriable: true,
    },
  },
})

/** Rate limit solo su GET /products con parametro q (autocomplete / typeahead). */
export function catalogSearchRateLimit(req: Request, res: Response, next: NextFunction) {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined
  if (!isCatalogSearchQueryPresent(q)) {
    next()
    return
  }
  searchLimiter(req, res, next)
}
