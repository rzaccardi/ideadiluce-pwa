import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { siteLocaleQuerySchema } from '../site/site-admin.validators.js'
import { siteService } from '../site/site.service.js'
import {
  guidePatchSchema,
  guideSlugParamSchema,
  siteGuideService,
} from './site-guides.service.js'
import { guidePageKey } from './site-guides.constants.js'
import { sitePagePatchSchema, sitePageTranslateSchema } from '../site/site-admin.validators.js'

export const siteGuidesAdminRouter = Router()

siteGuidesAdminRouter.use(loadAdminSession, requireAdminAuth)

siteGuidesAdminRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : undefined
    const pageSizeRaw = typeof req.query.pageSize === 'string' ? Number(req.query.pageSize) : undefined
    if (pageRaw != null || pageSizeRaw != null) {
      res.json(ok(await siteGuideService.listAdminGuidesPage(pageRaw ?? 1, pageSizeRaw ?? 25)))
      return
    }
    res.json(ok(await siteGuideService.listAdminGuides()))
  }),
)

siteGuidesAdminRouter.get(
  '/:slug',
  validateRequest({ params: guideSlugParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(ok(await siteGuideService.getAdminGuide(req.params.slug)))
  }),
)

siteGuidesAdminRouter.patch(
  '/:slug',
  validateRequest({ params: guideSlugParamSchema, body: guidePatchSchema }),
  asyncHandler(async (req, res) => {
    const updated = await siteGuideService.updateAdminGuide(req.params.slug, req.body)
    res.json(ok(updated))
  }),
)

siteGuidesAdminRouter.put(
  '/:slug/content',
  validateRequest({
    params: guideSlugParamSchema,
    query: siteLocaleQuerySchema,
    body: sitePagePatchSchema,
  }),
  asyncHandler(async (req, res) => {
    const pageKey = guidePageKey(req.params.slug)
    const { content, published = true, translateAllLocales = false } = req.body
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'IT'
    if (translateAllLocales && locale === 'IT') {
      res.json(ok(await siteService.saveAdminPageAndTranslate(pageKey, content, published)))
      return
    }
    res.json(ok(await siteService.saveAdminPage(pageKey, locale, content, published)))
  }),
)

siteGuidesAdminRouter.post(
  '/:slug/translate',
  validateRequest({
    params: guideSlugParamSchema,
    body: sitePageTranslateSchema,
  }),
  asyncHandler(async (req, res) => {
    const pageKey = guidePageKey(req.params.slug)
    const { content, sourceLocale = 'IT', onlyMissingLocales = false } = req.body
    res.json(
      ok(
        await siteService.translateAdminPageToLocales(pageKey, content, sourceLocale, {
          onlyMissingLocales,
        }),
      ),
    )
  }),
)
