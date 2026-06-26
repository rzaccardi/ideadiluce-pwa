import { Router } from 'express'
import { loadAdminSession } from '../../middlewares/admin-session.js'
import { requireAdminAuth } from '../../middlewares/admin-auth.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { siteService } from './site.service.js'
import {
  siteLocaleQuerySchema,
  sitePageKeyParamSchema,
  sitePagePatchSchema,
  sitePageTranslateSchema,
  siteTranslateMissingSchema,
} from './site-admin.validators.js'

export const siteAdminRouter = Router()

siteAdminRouter.use(loadAdminSession, requireAdminAuth)

siteAdminRouter.get(
  '/pages',
  asyncHandler(async (_req, res) => {
    res.json(ok(await siteService.listAdminPages()))
  }),
)

siteAdminRouter.get(
  '/catalog',
  asyncHandler(async (_req, res) => {
    res.json(ok(await siteService.listAdminCatalog()))
  }),
)

siteAdminRouter.get(
  '/i18n/status',
  asyncHandler(async (_req, res) => {
    res.json(ok(siteService.getI18nStatus()))
  }),
)

siteAdminRouter.get(
  '/pages/:pageKey',
  validateRequest({ params: sitePageKeyParamSchema, query: siteLocaleQuerySchema }),
  asyncHandler(async (req, res) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'IT'
    res.json(ok(await siteService.getAdminPage(req.params.pageKey, locale)))
  }),
)

siteAdminRouter.put(
  '/pages/:pageKey',
  validateRequest({
    params: sitePageKeyParamSchema,
    query: siteLocaleQuerySchema,
    body: sitePagePatchSchema,
  }),
  asyncHandler(async (req, res) => {
    const { content, published = true, translateAllLocales = false } = req.body
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'IT'
    if (translateAllLocales && locale === 'IT') {
      res.json(ok(await siteService.saveAdminPageAndTranslate(req.params.pageKey, content, published)))
      return
    }
    res.json(ok(await siteService.saveAdminPage(req.params.pageKey, locale, content, published)))
  }),
)

siteAdminRouter.post(
  '/i18n/translate-missing',
  validateRequest({ body: siteTranslateMissingSchema }),
  asyncHandler(async (req, res) => {
    const { pageKeys, targetLocales } = req.body
    res.json(ok(await siteService.translateAllMissingPages(pageKeys, targetLocales)))
  }),
)

siteAdminRouter.post(
  '/pages/:pageKey/translate',
  validateRequest({
    params: sitePageKeyParamSchema,
    body: sitePageTranslateSchema,
  }),
  asyncHandler(async (req, res) => {
    const { content, sourceLocale = 'IT', onlyMissingLocales = false } = req.body
    res.json(
      ok(
        await siteService.translateAdminPageToLocales(
          req.params.pageKey,
          content,
          sourceLocale,
          { onlyMissingLocales },
        ),
      ),
    )
  }),
)
