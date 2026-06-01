import { randomUUID } from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '../../types/errors.js'
import type { PwaPaymentMethodDTO } from '../../types/dto.js'
import {
  createStripeCheckoutSession,
  findOrCreateStripeCustomer,
  type StripeLineItemInput,
} from './stripeCheckoutAdapter.js'
import { isStripeConfigured } from '../../lib/stripe.js'

export type ProviderSessionInput = {
  orderId: string
  pwaPaymentId: string
  cartId: string
  odooSaleOrderId: number | null
  method: PwaPaymentMethodDTO
  amount: number
  currencyCode: string
  email: string
  correlationId: string
  lineItems?: StripeLineItemInput[]
}

export type ProviderSessionResult = {
  provider: string
  providerSessionId: string
  providerTransactionId?: string
  status: 'created' | 'pending'
  redirectUrl?: string | null
  clientSecret?: string | null
  instructions?: Record<string, unknown> | null
  raw?: Record<string, unknown>
}

function bankTransferInstructions(input: ProviderSessionInput): Record<string, unknown> {
  const holder = env.BANK_TRANSFER_HOLDER?.trim() || 'Intestatario non configurato'
  const iban = env.BANK_TRANSFER_IBAN?.trim() || 'IBAN non configurato'
  const bankName = env.BANK_TRANSFER_BANK_NAME?.trim() || null
  const reference = input.odooSaleOrderId
    ? `ORDINE ODOO ${input.odooSaleOrderId}`
    : `ORDINE PWA ${input.orderId}`

  return {
    holder,
    iban,
    bankName,
    reference,
    amount: input.amount,
    currencyCode: input.currencyCode,
    note: 'Il pagamento verra confermato dopo verifica/ricezione del bonifico.',
  }
}

function providerSetupError(method: PwaPaymentMethodDTO): AppError {
  const provider = method === 'paypal' ? 'PayPal' : 'Nexi'
  return new AppError(
    'PAYMENT_PROVIDER_NOT_CONFIGURED',
    `${provider} provider not configured`,
    `${provider} non è ancora configurato per il checkout PWA.`,
    409,
    false,
    { method },
  )
}

export async function createProviderPaymentSession(
  input: ProviderSessionInput,
): Promise<ProviderSessionResult> {
  if (input.method === 'stripe') {
    if (!isStripeConfigured()) {
      throw new AppError(
        'PAYMENT_PROVIDER_NOT_CONFIGURED',
        'Stripe not configured',
        'Stripe non è configurato per il checkout PWA.',
        409,
        false,
        { method: input.method },
      )
    }
    const stripeCustomerId = await findOrCreateStripeCustomer(input.email)
    const lineItems =
      input.lineItems ??
      [
        {
          name: `Ordine ${input.orderId}`,
          amountCents: input.amount,
          quantity: 1,
          currencyCode: input.currencyCode,
        },
      ]
    const session = await createStripeCheckoutSession({
      pwaOrderId: input.orderId,
      pwaPaymentId: input.pwaPaymentId,
      cartId: input.cartId,
      odooSaleOrderId: input.odooSaleOrderId,
      correlationId: input.correlationId,
      email: input.email,
      lineItems,
      stripeCustomerId,
    })
    return {
      provider: 'stripe',
      providerSessionId: session.sessionId,
      status: 'created',
      clientSecret: session.clientSecret,
      redirectUrl: null,
      raw: { ui_mode: 'custom' },
    }
  }

  if (input.method === 'bank_transfer') {
    return {
      provider: 'bank_transfer',
      providerSessionId: `bt_${randomUUID()}`,
      status: 'pending',
      instructions: bankTransferInstructions(input),
      raw: { mode: 'offline' },
    }
  }

  if (input.method === 'paypal') {
    if (!env.PAYPAL_ENABLED || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
      throw providerSetupError(input.method)
    }
    const providerSessionId = `paypal_${randomUUID()}`
    const base = env.PAYPAL_CHECKOUT_BASE_URL?.replace(/\/$/, '')
    return {
      provider: 'paypal',
      providerSessionId,
      status: 'created',
      redirectUrl: base ? `${base}?token=${encodeURIComponent(providerSessionId)}` : null,
      raw: { env: env.PAYPAL_ENV, mode: 'redirect_or_sdk_placeholder' },
    }
  }

  if (!env.NEXI_ENABLED || !env.NEXI_API_KEY || !env.NEXI_TERMINAL_ID) {
    throw providerSetupError(input.method)
  }

  const providerSessionId = `nexi_${randomUUID()}`
  const base = env.NEXI_CHECKOUT_BASE_URL?.replace(/\/$/, '')
  return {
    provider: 'nexi',
    providerSessionId,
    status: 'created',
    redirectUrl: base ? `${base}?session=${encodeURIComponent(providerSessionId)}` : null,
    raw: {
      env: env.NEXI_ENV,
      terminalId: env.NEXI_TERMINAL_ID,
      method: input.method,
      mode: 'hosted_or_sdk_placeholder',
    },
  }
}

