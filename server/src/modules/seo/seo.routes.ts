import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { validateMerchantFeedSample } from './merchant-feed.service.js'
import {
  getCachedLlmsTxt,
  getCachedMerchantFeedXml,
  getCachedSitemapXml,
} from './seo-cache.service.js'
import { LLMS_TXT_CONTENT_TYPE } from './llms.service.js'
import { sendSeoPublicAsset } from './seo-response.js'
import { findSeoRedirect } from './seo-redirect.service.js'

export const seoRouter = Router()

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const { body, builtAt } = await getCachedSitemapXml()
    sendSeoPublicAsset(res, 'application/xml; charset=utf-8', body, builtAt)
  }),
)

seoRouter.get(
  '/llms.txt',
  asyncHandler(async (_req, res) => {
    const { body, builtAt } = await getCachedLlmsTxt()
    sendSeoPublicAsset(res, LLMS_TXT_CONTENT_TYPE, body, builtAt)
  }),
)

seoRouter.get(
  '/merchant-feed.xml',
  asyncHandler(async (_req, res) => {
    const { body, builtAt } = await getCachedMerchantFeedXml()
    sendSeoPublicAsset(res, 'application/xml; charset=utf-8', body, builtAt)
  }),
)

seoRouter.get(
  '/merchant-feed/validate',
  asyncHandler(async (_req, res) => {
    const sample = await validateMerchantFeedSample(20)
    res.json({ data: { items: sample } })
  }),
)

/** Lookup redirect per middleware PWA (pubblico, solo lettura). */
seoRouter.get(
  '/redirect',
  asyncHandler(async (req, res) => {
    const path = typeof req.query.path === 'string' ? req.query.path : '/'
    const redirect = await findSeoRedirect(path)
    if (!redirect) {
      res.json({ data: null })
      return
    }
    res.json({
      data: {
        fromPath: redirect.fromPath,
        toPath: redirect.toPath,
        statusCode: redirect.statusCode,
      },
    })
  }),
)
