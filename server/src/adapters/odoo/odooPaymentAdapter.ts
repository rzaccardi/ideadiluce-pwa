/** Pagamenti: genera URL pubbliche Odoo Portal, mai URL backend `/web#...`. */
import { env } from '../../config/env.js'
import { isOdooConfigured } from './odooClient.js'
import type { OdooCallContext } from './odooClient.js'
import { createMockOdooPaymentAdapter } from './odooPaymentMock.js'
import { createLiveOdooPaymentAdapter } from './odooPaymentLive.js'

export type PaymentRedirectInput = {
  cartId: string
  email: string
  odooPartnerId?: number | null
  odooSaleOrderId?: number | null
  returnUrl?: string
}

export type OdooPaymentDocumentModel = 'sale.order' | 'account.move'

export type PortalPaymentUrlInput = {
  documentModel: OdooPaymentDocumentModel
  documentId: number
}

export type PortalPaymentUrlResult = {
  paymentUrl: string
  providerRef?: string
  debug?: Record<string, unknown>
}

export interface OdooPaymentAdapter {
  createCheckoutRedirect(
    ctx: OdooCallContext,
    input: PaymentRedirectInput,
  ): Promise<{ redirectUrl: string | null; providerRef?: string; debug?: Record<string, unknown> }>
  createPortalPaymentUrl(
    ctx: OdooCallContext,
    input: PortalPaymentUrlInput,
  ): Promise<PortalPaymentUrlResult>
  getPaymentStatus(
    ctx: OdooCallContext,
    externalPaymentId: string,
  ): Promise<{ status: 'pending' | 'done' | 'error' }>
}

export function createOdooPaymentAdapter(): OdooPaymentAdapter {
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooPaymentAdapter()
  }
  return createMockOdooPaymentAdapter()
}
