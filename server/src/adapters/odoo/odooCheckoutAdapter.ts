import { createOdooPaymentAdapter } from './odooPaymentAdapter.js'

const paymentAdapter = createOdooPaymentAdapter()

/**
 * Bridge checkout lato backend: dopo che `testCheckout` / checkout service hanno creato
 * `sale.order` e partner via XML-RPC Odoo 18, questo adapter delega al payment adapter
 * solo la costruzione dell’URL di redirect (ancora placeholder senza `payment.transaction` reale).
 */
export type CreateCheckoutRedirectInput = {
  cartId: string
  email: string
  odooPartnerId?: number | null
  odooSaleOrderId?: number | null
  returnUrl?: string
  correlationId: string
}

export interface OdooCheckoutAdapter {
  createCheckoutRedirect(
    input: CreateCheckoutRedirectInput,
  ): Promise<{ redirectUrl: string | null; providerRef?: string; debug?: Record<string, unknown> }>
}

/** Orchestrazione sottile: il comportamento mock/live è nel `createOdooPaymentAdapter()`. */
export function createOdooCheckoutAdapter(): OdooCheckoutAdapter {
  return {
    async createCheckoutRedirect(input) {
      const ctx = { correlationId: input.correlationId }
      return paymentAdapter.createCheckoutRedirect(ctx, {
        cartId: input.cartId,
        email: input.email,
        odooPartnerId: input.odooPartnerId,
        odooSaleOrderId: input.odooSaleOrderId,
        returnUrl: input.returnUrl,
      })
    },
  }
}
