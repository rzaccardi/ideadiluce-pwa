import { Router } from 'express'
import { ok } from '../lib/api-response.js'
import { env } from '../config/env.js'

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json(ok({ status: 'ok', env: env.NODE_ENV, time: new Date().toISOString() }))
})
