import type Stripe from 'stripe'
import { env } from '../../config/env.js'
import { getStripe, isStripeConfigured } from '../../lib/stripe.js'
import { AppError } from '../../types/errors.js'

export type StripeLineItemInput = {
  name: string
  amountCents: number
  quantity: number
  currencyCode: string
  metadata?: Record<string, string>
}

export type CreateStripeSessionInput = {
  pwaOrderId: string
  pwaPaymentId: string
  cartId: string
  odooSaleOrderId: number | null
  correlationId: string
  email: string
  lineItems: StripeLineItemInput[]
  stripeCustomerId?: string | null
}

export async function findOrCreateStripeCustomer(email: string): Promise<string | null> {
  if (!isStripeConfigured()) return null
  const stripe = getStripe()
  const existing = await stripe.customers.list({ email, limit: 1 })
  if (existing.data[0]) return existing.data[0].id
  const created = await stripe.customers.create({ email })
  return created.id
}

export async function createStripeCheckoutSession(
  input: CreateStripeSessionInput,
): Promise<{ sessionId: string; clientSecret: string }> {
  if (!isStripeConfigured()) {
    throw new AppError(
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      'Stripe not configured',
      'Stripe non è configurato per il checkout PWA.',
      409,
      false,
    )
  }

  const stripe = getStripe()
  const line_items = input.lineItems.map((li) => ({
    quantity: li.quantity,
    price_data: {
      currency: li.currencyCode.toLowerCase(),
      unit_amount: li.amountCents,
      product_data: {
        name: li.name,
        metadata: li.metadata ?? {},
      },
    },
  }))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    ui_mode: 'custom' as Stripe.Checkout.SessionCreateParams.UiMode,
    customer: input.stripeCustomerId ?? undefined,
    customer_email: input.stripeCustomerId ? undefined : input.email,
    line_items,
    metadata: {
      pwa_order_id: input.pwaOrderId,
      pwa_payment_id: input.pwaPaymentId,
      cart_id: input.cartId,
      odoo_sale_order_id: input.odooSaleOrderId != null ? String(input.odooSaleOrderId) : '',
      correlation_id: input.correlationId,
    },
    client_reference_id: input.pwaOrderId,
  })

  if (!session.client_secret) {
    throw new AppError(
      'STRIPE_SESSION_ERROR',
      'Missing client_secret',
      'Impossibile avviare il pagamento Stripe.',
      502,
      false,
    )
  }

  return { sessionId: session.id, clientSecret: session.client_secret }
}

export async function retrieveStripeCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  return stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] })
}

export function constructStripeWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET?.trim()) {
    throw new AppError('STRIPE_WEBHOOK_NOT_CONFIGURED', 'No webhook secret', 'Webhook Stripe non configurato.', 500, false)
  }
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET.trim())
}
