import { Router } from 'express'
import { z } from 'zod'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { validateMerchantFeedSample } from './merchant-feed.service.js'
import { getSeoCacheStatus, refreshMerchantFeed, refreshSeoCaches } from './seo-cache.service.js'
import {
  getMerchantCenterSettingsDTO,
  patchMerchantCenterSettings,
} from './merchant-center.settings.js'
import { merchantCenterSettingsPatchSchema } from './merchant-center.validators.js'
import {
  deleteSeoRedirect,
  listSeoRedirects,
  listSeoRedirectsPage,
  upsertSeoRedirect,
} from './seo-redirect.service.js'

export const seoAdminRouter = Router()

seoAdminRouter.use(loadAdminSession, requireAdminAuth)

function publicSiteBase() {
  return env.PUBLIC_SITE_URL.replace(/\/$/, '')
}

seoAdminRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const site = publicSiteBase()
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
  '/merchant-center',
  asyncHandler(async (_req, res) => {
    const settings = await getMerchantCenterSettingsDTO()
    const status = getSeoCacheStatus()
    res.json(
      ok({
        ...settings,
        publicFeedUrl: `${publicSiteBase()}/merchant-feed.xml`,
        lastBuiltAt: status.merchantFeed?.builtAt ?? null,
        itemCount: status.merchantFeed?.itemCount ?? null,
      }),
    )
  }),
)

seoAdminRouter.patch(
  '/merchant-center',
  validateRequest({ body: merchantCenterSettingsPatchSchema }),
  asyncHandler(async (req, res) => {
    const settings = await patchMerchantCenterSettings(req.body)
    void refreshMerchantFeed()
      .then((entry) => {
        logger.info('seo.merchant_feed_refreshed', { itemCount: entry.itemCount })
      })
      .catch((err) => {
        logger.warn('seo.merchant_feed_refresh_failed', { err: String(err) })
      })
    const status = getSeoCacheStatus()
    res.json(
      ok({
        ...settings,
        publicFeedUrl: `${publicSiteBase()}/merchant-feed.xml`,
        lastBuiltAt: status.merchantFeed?.builtAt ?? null,
        itemCount: status.merchantFeed?.itemCount ?? null,
      }),
    )
  }),
)

seoAdminRouter.get(
  '/merchant-feed/validate',
  asyncHandler(async (_req, res) => {
    const sample = await validateMerchantFeedSample(20)
    res.json(ok(sample))
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
