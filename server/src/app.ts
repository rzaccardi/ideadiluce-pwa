import express from 'express'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { env } from './config/env.js'
import { correlationMiddleware } from './lib/correlation.js'
import { healthRouter } from './routes/health.js'
import { v1Router } from './routes/v1/index.js'
import { errorHandler } from './middlewares/error-handler.js'
import { loadOrCreateSession, loadSessionIfPresent } from './middlewares/session.js'
import { paymentsController } from './controllers/payments.controller.js'
import {
  getCachedLlmsTxt,
  getCachedMerchantFeedXml,
  getCachedSitemapXml,
} from './modules/seo/seo-cache.service.js'
import { sendSeoPublicAsset } from './modules/seo/seo-response.js'
import { arflyProxyRouter } from './modules/arfly-proxy/arfly-proxy.routes.js'
import { asyncHandler } from './utils/async-handler.js'

function isDevLocalhostOrigin(origin: string): boolean {
  try {
    const { protocol, hostname } = new URL(origin)
    return protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')
  } catch {
    return false
  }
}

export function createApp() {
  const app = express()
  app.set('trust proxy', 1)

  app.use(correlationMiddleware)
  app.use(compression())
  app.use(
    rateLimit({
      windowMs: 60_000,
      max: env.NODE_ENV === 'production' ? 300 : 2000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  )
  const corsOrigins = [...new Set([env.CLIENT_ORIGIN, env.ADMIN_ORIGIN])]
  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          corsOrigins.includes(origin) ||
          (env.NODE_ENV === 'development' && isDevLocalhostOrigin(origin))
        ) {
          callback(null, true)
          return
        }
        callback(new Error(`CORS: origine non consentita (${origin})`))
      },
      credentials: true,
    }),
  )
  app.use(cookieParser())
  app.post('/api/v1/payments/webhook/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
    void paymentsController.stripeWebhook(req, res, next)
  })
  app.use(express.json())

  app.use(healthRouter)
  app.get(
    '/sitemap.xml',
    asyncHandler(async (_req, res) => {
      const { body, builtAt } = await getCachedSitemapXml()
      sendSeoPublicAsset(res, 'application/xml; charset=utf-8', body, builtAt)
    }),
  )
  app.get(
    '/llms.txt',
    asyncHandler(async (_req, res) => {
      const { body, builtAt } = await getCachedLlmsTxt()
      sendSeoPublicAsset(res, 'text/plain; charset=utf-8', body, builtAt)
    }),
  )
  app.get(
    '/merchant-feed.xml',
    asyncHandler(async (_req, res) => {
      const { body, builtAt } = await getCachedMerchantFeedXml()
      sendSeoPublicAsset(res, 'application/xml; charset=utf-8', body, builtAt)
    }),
  )
  app.use('/api/v1', loadOrCreateSession, v1Router)
  app.use('/api/v2', loadSessionIfPresent, arflyProxyRouter)

  app.use(errorHandler)

  return app
}
