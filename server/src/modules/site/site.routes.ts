import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { ok } from '../../lib/api-response.js'
import { validateRequest } from '../../middlewares/validate-request.js'
import { siteService } from './site.service.js'
import { siteInquiryService } from './site-inquiry.service.js'
import { siteInquirySchema } from './site-inquiry.validators.js'
import { siteLocaleQuerySchema, sitePageKeyParamSchema } from './site-admin.validators.js'

export const siteRouter = Router()

siteRouter.get(
  '/pages/:pageKey',
  validateRequest({ params: sitePageKeyParamSchema, query: siteLocaleQuerySchema }),
  asyncHandler(async (req, res) => {
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'IT'
    res.json(ok(await siteService.getPublicPage(req.params.pageKey, locale)))
  }),
)

siteRouter.post(
  '/inquiries',
  validateRequest({ body: siteInquirySchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(ok(await siteInquiryService.submit(req.body)))
  }),
)
