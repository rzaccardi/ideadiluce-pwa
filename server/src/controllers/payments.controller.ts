import type { Request, Response } from 'express'
import { ok } from '../lib/api-response.js'
import { asyncHandler } from '../utils/async-handler.js'
import { paymentsService } from '../modules/payments/payments.service.js'
import {
  finalizeStripeCheckout,
  finalizeStripeCheckoutByOrderId,
  handleStripeWebhookEvent,
} from '../modules/payments/stripeFinalize.service.js'
import { constructStripeWebhookEvent } from '../adapters/payments/stripeCheckoutAdapter.js'
import type {
  ConfirmPaymentBody,
  CreatePaymentSessionBody,
} from '../modules/payments/payments.validators.js'

export const paymentsController = {
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreatePaymentSessionBody
    const data = await paymentsService.createPaymentSession(req, body)
    res.status(201).json(ok(data))
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ConfirmPaymentBody
    const data = await paymentsService.confirmPayment(req, body)
    res.json(ok(data))
  }),

  nexiWebhook: asyncHandler(async (_req: Request, res: Response) => {
    res.status(202).json(ok({ accepted: true, note: 'Webhook Nexi ricevuto: verifica firma da collegare alle API Nexi reali.' }))
  }),

  paypalWebhook: asyncHandler(async (_req: Request, res: Response) => {
    res.status(202).json(ok({ accepted: true, note: 'Webhook PayPal ricevuto: verifica webhook da collegare alle API PayPal reali.' }))
  }),

  stripeReturn: asyncHandler(async (req: Request, res: Response) => {
    const sessionId = String(req.query.session_id ?? '')
    const orderId = String(req.query.order_id ?? '')
    if (sessionId) {
      res.json(ok(await finalizeStripeCheckout(req, sessionId)))
      return
    }
    if (orderId) {
      res.json(ok(await finalizeStripeCheckoutByOrderId(req, orderId)))
      return
    }
    res.status(400).json(ok({ error: 'session_id o order_id richiesto' }))
  }),

  stripeWebhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      res.status(400).send('Missing stripe-signature')
      return
    }
    const event = constructStripeWebhookEvent(req.body as Buffer, signature)
    await handleStripeWebhookEvent(req, event)
    res.json({ received: true })
  }),
}

