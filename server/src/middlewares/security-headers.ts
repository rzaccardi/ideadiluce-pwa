import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'

/** Header di base: non sostituiscono un WAF, riducono clickjacking e sniffing. */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }
  next()
}
