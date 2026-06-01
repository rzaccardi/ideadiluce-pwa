import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { checkoutService } from '../modules/checkout/checkout.service.js'
import { paymentsService } from '../modules/payments/payments.service.js'
import type { CheckoutStartBody } from '../modules/payments/payments.validators.js'
import { asyncHandler } from '../utils/async-handler.js'

export const checkoutController = {
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string }
    const data = await checkoutService.createSession(req, email)
    res.status(201).json(ok(data))
  }),

  getSession: asyncHandler(async (req: Request, res: Response) => {
    const data = await checkoutService.getSession(req, req.params.id)
    res.json(ok(data))
  }),

  redirect: asyncHandler(async (req: Request, res: Response) => {
    const data = await checkoutService.redirect(req, req.params.id)
    res.json(ok(data))
  }),

  paymentUrl: asyncHandler(async (req: Request, res: Response) => {
    const data = await checkoutService.paymentUrl(req, req.params.id)
    res.json(ok(data))
  }),

  start: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CheckoutStartBody
    const data = await paymentsService.startCheckout(req, body)
    res.status(201).json(ok(data))
  }),
}
