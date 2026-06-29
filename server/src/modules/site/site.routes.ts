import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { siteService } from './site.service.js'
import { siteInquiryRouter } from './site-inquiry.routes.js'
import { siteLocaleQuerySchema, sitePageKeyParamSchema } from './site-admin.validators.js'
import { siteGuidesPublicQuerySchema } from '../site-guides/site-guides.validators.js'

export const siteRouter = Router()

siteRouter.get(
  '/guides',
  validateRequest({ query: siteGuidesPublicQuerySchema }),
  asyncHandler(async (req, res) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'IT'
    const featured = req.query.featured === 'true'
    const { siteGuideService } = await import('../site-guides/site-guides.service.js')
    res.json(ok(await siteGuideService.listPublicGuides(locale, { featuredOnly: featured })))
  }),
)

siteRouter.get(
  '/pages/:pageKey',
  validateRequest({ params: sitePageKeyParamSchema, query: siteLocaleQuerySchema }),
  asyncHandler(async (req, res) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'IT'
    res.json(ok(await siteService.getPublicPage(req.params.pageKey, locale)))
  }),
)

siteRouter.use('/inquiries', siteInquiryRouter)
