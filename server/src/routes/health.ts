import { Router } from 'express'
import { ok } from '../lib/api-response.js'
import { env } from '../config/env.js'

export function healthData() {
  return { status: 'ok' as const, env: env.NODE_ENV, time: new Date().toISOString() }
}

export const healthRouter = Router()

healthRouter.get('/health', (_req, res) => {
  res.json(ok(healthData()))
})
