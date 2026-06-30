import { Router } from 'express'
import { z } from 'zod'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { env } from '../../config/env.js'
import { validateMerchantFeedSample } from './merchant-feed.service.js'
import { getSeoCacheStatus, refreshSeoCaches } from './seo-cache.service.js'
import {
  deleteSeoRedirect,
  listSeoRedirects,
  listSeoRedirectsPage,
  upsertSeoRedirect,
} from './seo-redirect.service.js'

export const seoAdminRouter = Router()

seoAdminRouter.use(loadAdminSession, requireAdminAuth)

seoAdminRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const site = env.PUBLIC_SITE_URL.replace(/\/$/, '')
    res.json(
      ok({
        ...getSeoCacheStatus(),
        publicUrls: {
          sitemap: `${site}/sitemap.xml`,
          merchantFeed: `${site}/merchant-feed.xml`,
          llms: `${site}/llms.txt`,
        },
      }),
    )
  }),
)

seoAdminRouter.post(
  '/refresh',
  asyncHandler(async (_req, res) => {
    const result = await refreshSeoCaches()
    res.json(ok(result))
  }),
)

seoAdminRouter.get(
  '/merchant-feed/validate',
  asyncHandler(async (_req, res) => {
    const items = await validateMerchantFeedSample(20)
    res.json(ok({ items }))
  }),
)

seoAdminRouter.get(
  '/redirects',
  asyncHandler(async (req, res) => {
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : undefined
    const pageSizeRaw = typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : undefined
    if (pageRaw != null || pageSizeRaw != null) {
      res.json(ok(await listSeoRedirectsPage(pageRaw ?? 1, pageSizeRaw ?? 50)))
      return
    }
    const items = await listSeoRedirects()
    res.json(ok({ items }))
  }),
)

const upsertSchema = z.object({
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  statusCode: z.number().int().min(301).max(308).optional(),
  reason: z.string().nullable().optional(),
})

seoAdminRouter.post(
  '/redirects',
  validateRequest({ body: upsertSchema }),
  asyncHandler(async (req, res) => {
    const item = await upsertSeoRedirect(req.body)
    res.json(ok(item))
  }),
)

seoAdminRouter.delete(
  '/redirects',
  asyncHandler(async (req, res) => {
    const path = typeof req.query.path === 'string' ? req.query.path : ''
    if (!path) {
      res.status(400).json({ error: { message: 'path richiesto' } })
      return
    }
    await deleteSeoRedirect(path)
    res.json(ok({ ok: true }))
  }),
)
