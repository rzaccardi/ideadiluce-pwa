import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { correlationMiddleware } from './lib/correlation.js'
import { healthRouter } from './routes/health.js'
import { v1Router } from './routes/v1/index.js'
import { errorHandler } from './middlewares/error-handler.js'
import { loadOrCreateSession } from './middlewares/session.js'
import { paymentsController } from './controllers/payments.controller.js'
export function createApp() {
  const app = express()

  app.use(correlationMiddleware)
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  )
  app.use(cookieParser())
  app.post('/api/v1/payments/webhook/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
    void paymentsController.stripeWebhook(req, res, next)
  })
  app.use(express.json())

  app.use(healthRouter)
  app.use('/api/v1', loadOrCreateSession, v1Router)

  app.use(errorHandler)

  return app
}
