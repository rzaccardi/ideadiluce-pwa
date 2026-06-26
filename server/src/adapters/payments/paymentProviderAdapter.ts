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

function unsupportedCheckoutMethodError(method: string): AppError {
  return new AppError(
    'PAYMENT_METHOD_NOT_SUPPORTED',
    `Payment method not supported: ${method}`,
    'Metodo di pagamento non disponibile. Usa carta (Stripe) o bonifico.',
    400,
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
      raw: { ui_mode: 'elements' },
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

  throw unsupportedCheckoutMethodError(input.method)
}

