import { randomUUID } from 'node:crypto'
import { AppError } from '../../types/errors.js'
import type { PwaPaymentMethodDTO } from '../../types/dto.js'
import { buildBankTransferInstructions } from '../../modules/payments/bankTransferInstructions.js'
import { alignStripeLineItems } from '../../modules/payments/stripe-line-items.js'
import {
  createStripeCheckoutSession,
  findOrCreateStripeCustomer,
  type StripeLineItemInput,
  type StripePwaAddress,
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
  phone?: string | null
  correlationId: string
  lineItems?: StripeLineItemInput[]
  taxLabel?: string | null
  billingAddress?: StripePwaAddress | null
  shippingAddress?: StripePwaAddress | null
  bankTransferOrder?: Parameters<typeof buildBankTransferInstructions>[0]['order']
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
    const stripeCustomerId = await findOrCreateStripeCustomer({
      email: input.email,
      phone: input.phone,
      billingAddress: input.billingAddress,
      shippingAddress: input.shippingAddress,
    })
    const lineItems = alignStripeLineItems({
      lines: input.lineItems ?? [],
      amountCents: input.amount,
      currencyCode: input.currencyCode,
      taxLabel: input.taxLabel,
    })
    const session = await createStripeCheckoutSession({
      pwaOrderId: input.orderId,
      pwaPaymentId: input.pwaPaymentId,
      cartId: input.cartId,
      odooSaleOrderId: input.odooSaleOrderId,
      correlationId: input.correlationId,
      email: input.email,
      lineItems,
      stripeCustomerId,
      billingAddress: input.billingAddress,
      shippingAddress: input.shippingAddress,
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
    const order = input.bankTransferOrder ?? {
      id: input.orderId,
      odooSaleOrderId: input.odooSaleOrderId,
      odooSaleOrderName: null,
      createdAt: new Date(),
      billingAddressJson: null,
      shippingAddressJson: null,
      fiscalJson: null,
      email: input.email,
      currencyCode: input.currencyCode,
    }
    return {
      provider: 'bank_transfer',
      providerSessionId: `bt_${randomUUID()}`,
      status: 'pending',
      instructions: buildBankTransferInstructions({
        order,
        amountCents: input.amount,
        currencyCode: input.currencyCode,
      }),
      raw: { mode: 'offline' },
    }
  }

  throw unsupportedCheckoutMethodError(input.method)
}

