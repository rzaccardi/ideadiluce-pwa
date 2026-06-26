import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { buildLlmsTxt } from './llms.service.js'
import { buildProductSitemapXml } from './sitemap.service.js'

export const seoRouter = Router()

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const xml = await buildProductSitemapXml()
    res.type('application/xml').send(xml)
  }),
)

seoRouter.get('/llms.txt', (_req, res) => {
  res.type('text/plain; charset=utf-8').send(buildLlmsTxt())
})
