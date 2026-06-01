import { env } from '../../config/env.js'
import type { OdooCallContext } from './odooClient.js'
import type {
  OdooPaymentAdapter,
  PaymentRedirectInput,
  PortalPaymentUrlInput,
} from './odooPaymentAdapter.js'

export function createMockOdooPaymentAdapter(): OdooPaymentAdapter {
  return {
    async createCheckoutRedirect(_ctx: OdooCallContext, input: PaymentRedirectInput) {
      const base =
        env.CHECKOUT_REDIRECT_BASE?.replace(/\/$/, '') ?? 'https://checkout.example.com/pay'
      const redirectUrl = `${base}?cart=${encodeURIComponent(input.cartId)}&email=${encodeURIComponent(input.email)}`
      return {
        redirectUrl,
        providerRef: 'mock-checkout',
        debug: { mode: 'mock_redirect' },
      }
    },
    async createPortalPaymentUrl(_ctx: OdooCallContext, input: PortalPaymentUrlInput) {
      const base =
        env.CHECKOUT_REDIRECT_BASE?.replace(/\/$/, '') ?? 'https://checkout.example.com/pay'
      const paymentUrl = `${base}?model=${encodeURIComponent(input.documentModel)}&id=${String(input.documentId)}`
      return {
        paymentUrl,
        providerRef: 'mock-portal-payment-url',
        debug: { mode: 'mock_portal_payment_url' },
      }
    },
    async getPaymentStatus(_ctx: OdooCallContext, _externalPaymentId: string) {
      return { status: 'pending' as const }
    },
  }
}
