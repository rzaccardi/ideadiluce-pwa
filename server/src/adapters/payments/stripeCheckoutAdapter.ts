import type Stripe from 'stripe'
import { env } from '../../config/env.js'
import { getStripe, isStripeConfigured } from '../../lib/stripe.js'
import { decodeStripeClientSecret } from '../../lib/stripe-config.js'
import { sumStripeLineItems } from '../../modules/payments/stripe-line-items.js'
import { STRIPE_ODOO_SALE_ORDER_ID_META } from '../../modules/payments/stripe-odoo-link.js'
import { AppError } from '../../types/errors.js'
import {
  parseStripePwaAddress,
  stripeCustomerName,
  toStripeAddressFields,
  toStripeShippingFields,
  type StripePwaAddress,
  type StripeShippingFields,
} from './stripe-address.js'

function checkoutReturnUrl(pwaOrderId: string): string {
  const origin = env.CLIENT_ORIGIN.replace(/\/$/, '')
  return `${origin}/checkout/return/${encodeURIComponent(pwaOrderId)}?session_id={CHECKOUT_SESSION_ID}`
}

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
  billingAddress?: StripePwaAddress | null
  shippingAddress?: StripePwaAddress | null
}

export type { StripePwaAddress }
export { parseStripePwaAddress }

function customerAddressParams(
  billing?: StripePwaAddress | null,
  shipping?: StripePwaAddress | null,
): Pick<Stripe.CustomerCreateParams, 'name' | 'address' | 'shipping'> {
  const billingAddr = billing ?? shipping ?? null
  const shippingAddr = shipping ?? billing ?? null
  return {
    ...(billingAddr ? { name: stripeCustomerName(billingAddr), address: toStripeAddressFields(billingAddr) } : {}),
    ...(shippingAddr ? { shipping: toStripeShippingFields(shippingAddr) } : {}),
  }
}

function stripeObjectId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && 'id' in value && typeof value.id === 'string') return value.id
  return null
}

async function applyCollectedShipping(
  stripe: Stripe,
  sessionId: string,
  shipping: StripeShippingFields,
): Promise<void> {
  await stripe.checkout.sessions.update(sessionId, {
    collected_information: {
      shipping_details: {
        name: shipping.name,
        address: {
          country: shipping.address.country,
          line1: shipping.address.line1,
          city: shipping.address.city,
          postal_code: shipping.address.postal_code,
          ...(shipping.address.line2 ? { line2: shipping.address.line2 } : {}),
          ...(shipping.address.state ? { state: shipping.address.state } : {}),
        },
      },
    },
  })
}

export async function findOrCreateStripeCustomer(input: {
  email: string
  phone?: string | null
  billingAddress?: StripePwaAddress | null
  shippingAddress?: StripePwaAddress | null
}): Promise<string | null> {
  if (!isStripeConfigured()) return null
  const stripe = getStripe()
  const nextPhone = input.phone?.trim()
  const addressParams = customerAddressParams(input.billingAddress, input.shippingAddress)
  const existing = await stripe.customers.list({ email: input.email, limit: 1 })
  if (existing.data[0]) {
    const customer = existing.data[0]
    const patch: Stripe.CustomerUpdateParams = { ...addressParams }
    if (nextPhone && customer.phone !== nextPhone) patch.phone = nextPhone
    if (Object.keys(patch).length > 0) {
      await stripe.customers.update(customer.id, patch)
    }
    return customer.id
  }
  const created = await stripe.customers.create({
    email: input.email,
    ...(nextPhone ? { phone: nextPhone } : {}),
    ...addressParams,
  })
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

  const sessionMetadata = {
    pwa_order_id: input.pwaOrderId,
    pwa_payment_id: input.pwaPaymentId,
    cart_id: input.cartId,
    [STRIPE_ODOO_SALE_ORDER_ID_META]:
      input.odooSaleOrderId != null ? String(input.odooSaleOrderId) : '',
    correlation_id: input.correlationId,
  }

  const shippingAddr = input.shippingAddress ?? input.billingAddress ?? null
  const shipping = shippingAddr ? toStripeShippingFields(shippingAddr) : null

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      ui_mode: 'elements' as Stripe.Checkout.SessionCreateParams.UiMode,
      return_url: checkoutReturnUrl(input.pwaOrderId),
      customer: input.stripeCustomerId ?? undefined,
      customer_email: input.stripeCustomerId ? undefined : input.email,
      ...(input.stripeCustomerId
        ? {
            customer_update: {
              address: 'auto' as const,
              name: 'auto' as const,
              shipping: 'auto' as const,
            },
          }
        : {}),
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: sessionMetadata,
        ...(shipping ? { shipping } : {}),
      },
      saved_payment_method_options: {
        payment_method_save: 'disabled',
      },
      wallet_options: {
        link: {
          display: 'never',
        },
      },
      line_items,
      metadata: sessionMetadata,
      client_reference_id: input.pwaOrderId,
    },
    {
      idempotencyKey: `pwa-checkout-phone-${input.pwaPaymentId}-${sumStripeLineItems(input.lineItems)}`,
    },
  )

  if (!session.client_secret) {
    throw new AppError(
      'STRIPE_SESSION_ERROR',
      'Missing client_secret',
      'Impossibile avviare il pagamento Stripe.',
      502,
      false,
    )
  }

  if (shipping) {
    try {
      await applyCollectedShipping(stripe, session.id, shipping)
    } catch {
      /* PI.shipping e customer.address restano valorizzati */
    }
  }

  return { sessionId: session.id, clientSecret: decodeStripeClientSecret(session.client_secret) }
}

export async function syncStripeCheckoutAddresses(
  session: Stripe.Checkout.Session,
  input: { billingAddress?: StripePwaAddress | null; shippingAddress?: StripePwaAddress | null },
): Promise<void> {
  if (!isStripeConfigured()) return
  const stripe = getStripe()
  const billing = input.billingAddress ?? input.shippingAddress ?? null
  const shippingAddr = input.shippingAddress ?? input.billingAddress ?? null
  const shipping = shippingAddr ? toStripeShippingFields(shippingAddr) : null
  const customerId = stripeObjectId(session.customer)
  if (customerId && (billing || shippingAddr)) {
    await stripe.customers.update(customerId, customerAddressParams(billing, shippingAddr))
  }
  if (shipping) {
    try {
      await applyCollectedShipping(stripe, session.id, shipping)
    } catch {
      /* collected_information non è sempre aggiornabile su sessioni elements già aperte */
    }
    const paymentIntentId = stripeObjectId(session.payment_intent)
    if (paymentIntentId) {
      try {
        await stripe.paymentIntents.update(paymentIntentId, { shipping })
      } catch {
        /* shipping già impostato in create; il confirm client invia comunque state */
      }
    }
  }
}

export async function retrieveStripeCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  return stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] })
}

/** Sessioni Elements riusabili solo finché Stripe le tiene in stato `open`. */
export async function isStripeCheckoutSessionOpen(sessionId: string): Promise<boolean> {
  const session = await retrieveStripeCheckoutSession(sessionId)
  return session.status === 'open'
}

export function constructStripeWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET?.trim()) {
    throw new AppError('STRIPE_WEBHOOK_NOT_CONFIGURED', 'No webhook secret', 'Webhook Stripe non configurato.', 500, false)
  }
  const stripe = getStripe()
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET.trim())
}
