import type { NextFunction, Request, Response } from 'express'
import { verifyRecaptchaToken, type RecaptchaAction } from '../lib/recaptcha.js'

export function requireRecaptcha(expectedAction: RecaptchaAction) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = (req.body as { recaptchaToken?: string } | undefined)?.recaptchaToken
      await verifyRecaptchaToken(token, req.ip, expectedAction)
      next()
    } catch (e) {
      next(e)
    }
  }
}
