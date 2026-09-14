/** Ordini: API v2 `POST /orders` (preferito) oppure XML-RPC `sale.order`. */
import { env } from '../../config/env.js'
import { isOdooConfigured } from './odooClient.js'
import { isOdooApiV2Configured } from '../odoo-api/odooApiClient.js'
import type { OdooCallContext } from './odooClient.js'
import { createMockOdooOrderAdapter } from './odooOrderMock.js'
import { createLiveOdooOrderAdapter } from './odooOrderLive.js'
import { createApiV2OdooOrderAdapter } from './odooOrderApi.js'
import type { SyncSaleOrderDraftInput } from '../../modules/checkout/checkout-order.types.js'

export type SaleOrderShippingLine = {
  label: string
  amountCents: number
  carrierCode?: string
  serviceCode?: string
}

export type SaleOrderInput = {
  odooPartnerId: number
  odooPartnerShippingId?: number | null
  odooSaleOrderId?: number | null
  clientOrderRef?: string | null
  orderNotes?: string | null
  courierNotes?: string | null
  fiscalPositionId?: number | null
  lines: Array<{
    productRef: string
    variantRef?: string | null
    quantity: number
    unitPriceCents?: number
  }>
  shippingLine?: SaleOrderShippingLine | null
  currencyCode: string
  pwaOrderId?: string
  paymentMethod?: string | null
  chargedCents?: number | null
  snapshotAt?: string
  taxRatePct?: number
}

export type SaleOrderLineInput = {
  productRef: string
  variantRef?: string | null
  quantity: number
  unitPriceCents?: number
  label?: string
}

export interface OdooOrderAdapter {
  createOrUpdateSaleOrder(
    ctx: OdooCallContext,
    input: SaleOrderInput,
  ): Promise<{ odooSaleOrderId: number }>
  syncSaleOrderDraft(
    ctx: OdooCallContext,
    input: SyncSaleOrderDraftInput,
  ): Promise<{ odooSaleOrderId: number }>
  reconcileSaleOrderLines(
    ctx: OdooCallContext,
    odooSaleOrderId: number,
    lines: SaleOrderLineInput[],
    shippingLine?: SaleOrderShippingLine | null,
  ): Promise<void>
  getOrderStatus(
    ctx: OdooCallContext,
    odooSaleOrderId: number,
  ): Promise<{ status: string; paymentStatus?: string }>
}

export function createOdooOrderAdapter(): OdooOrderAdapter {
  if (isOdooApiV2Configured()) {
    return createApiV2OdooOrderAdapter()
  }
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooOrderAdapter()
  }
  return createMockOdooOrderAdapter()
}
