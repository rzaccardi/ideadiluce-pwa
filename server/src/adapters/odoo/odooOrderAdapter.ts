/** Ordini: `sale.order` + righe via `execute_kw` (variante da slug `product.template`). */
import { env } from '../../config/env.js'
import { isOdooConfigured } from './odooClient.js'
import type { OdooCallContext } from './odooClient.js'
import { createMockOdooOrderAdapter } from './odooOrderMock.js'
import { createLiveOdooOrderAdapter } from './odooOrderLive.js'

export type SaleOrderShippingLine = {
  label: string
  amountCents: number
  carrierCode?: string
  serviceCode?: string
}

export type SaleOrderInput = {
  odooPartnerId: number
  lines: Array<{
    productRef: string
    variantRef?: string | null
    quantity: number
    unitPriceCents?: number
  }>
  shippingLine?: SaleOrderShippingLine | null
  currencyCode: string
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
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    return createLiveOdooOrderAdapter()
  }
  return createMockOdooOrderAdapter()
}
