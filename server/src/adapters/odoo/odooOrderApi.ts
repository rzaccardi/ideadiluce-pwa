import type { OdooCallContext } from './odooClient.js'
import type {
  OdooOrderAdapter,
  SaleOrderInput,
  SaleOrderLineInput,
  SaleOrderShippingLine,
} from './odooOrderAdapter.js'
import type { SyncSaleOrderDraftInput } from '../../modules/checkout/checkout-order.types.js'
import { parseOdooVariantId } from '../../modules/catalog/odooRef.js'
import { AppError } from '../../types/errors.js'
import { createOdooCustomerAdapter } from './odooCustomerAdapter.js'
import { OdooApiV2Error, toOdooApiV2AppError } from '../odoo-api/odooApiClient.js'
import { odooApiCreateOrder, odooApiGetOrder } from '../odoo-api/odooApi.resources.js'
import {
  mapOdooApiCarrier,
  mapOdooApiPaymentMethod,
  netEurosFromCents,
  netEurosFromNetCents,
} from '../odoo-api/odooApi.mapping.js'
import type { OdooApiOrder, OdooApiOrderWrite } from '../odoo-api/odooApi.types.js'
import { persistOdooOrderLink } from '../odoo-api/odooApi.sideEffects.js'

export type ApiV2SaleOrderResult = {
  odooSaleOrderId: number
  odooSaleOrderName?: string | null
  odooShippingAddressId?: number | null
  odooInvoiceAddressId?: number | null
}

function wrap(err: unknown, ctx: OdooCallContext): never {
  if (err instanceof AppError) throw err
  if (err instanceof OdooApiV2Error) throw toOdooApiV2AppError(err, ctx.correlationId)
  throw err
}

function resolveVariantProductId(line: SaleOrderLineInput): number | null {
  return parseOdooVariantId(line.variantRef)
}

function buildOrderPayload(
  input: SaleOrderInput & {
    pwaOrderId?: string
    paymentMethod?: string | null
    chargedCents?: number | null
    snapshotAt?: string
    taxRatePct?: number
  },
): OdooApiOrderWrite {
  const lines = input.lines
    .map((line) => {
      const productId = resolveVariantProductId(line)
      if (productId == null) return null
      return {
        product_id: productId,
        qty: line.quantity,
        price_unit_net: netEurosFromNetCents(line.unitPriceCents),
      }
    })
    .filter((line): line is NonNullable<typeof line> => line != null)

  if (lines.length === 0) {
    throw new AppError(
      'ODOO_ORDER_LINES_EMPTY',
      'No variant product_id for Odoo order lines',
      'Impossibile creare l’ordine: manca la variante prodotto.',
      400,
      false,
    )
  }

  const clientRef = input.clientOrderRef?.trim() || (input.pwaOrderId ? `pwa-${input.pwaOrderId}` : '')
  if (!clientRef) {
    throw new AppError(
      'ODOO_CLIENT_REF_MISSING',
      'client_ref missing',
      'Riferimento ordine PWA assente.',
      400,
      false,
    )
  }

  const payload: OdooApiOrderWrite = {
    client_ref: clientRef,
    customer_id: input.odooPartnerId,
    currency: input.currencyCode || 'EUR',
    lines,
    payment: { method: mapOdooApiPaymentMethod(input.paymentMethod) },
  }

  if (input.odooPartnerShippingId) payload.shipping_address_id = input.odooPartnerShippingId
  const invoiceId = (input as { odooPartnerInvoiceId?: number | null }).odooPartnerInvoiceId
  if (invoiceId) payload.invoice_address_id = invoiceId

  if (input.shippingLine) {
    payload.shipping = {
      carrier: mapOdooApiCarrier(input.shippingLine),
      amount_net: netEurosFromCents(input.shippingLine.amountCents, input.taxRatePct ?? 22),
      label: input.shippingLine.label,
    }
  }

  if (input.chargedCents != null || input.snapshotAt) {
    payload.pricing = {
      ...(input.snapshotAt ? { snapshot_at: input.snapshotAt } : {}),
      ...(input.chargedCents != null ? { charged_cents: input.chargedCents } : {}),
    }
  }

  return payload
}

function fromApiOrder(order: OdooApiOrder): ApiV2SaleOrderResult {
  return {
    odooSaleOrderId: order.id,
    odooSaleOrderName: order.name ?? null,
    odooShippingAddressId: order.shipping_address?.id ?? null,
    odooInvoiceAddressId: order.invoice_address?.id ?? null,
  }
}

async function resolveShippingPartnerId(
  ctx: OdooCallContext,
  input: SyncSaleOrderDraftInput,
): Promise<number | null> {
  const customerAdapter = createOdooCustomerAdapter()
  const resolved = await customerAdapter.resolveOrderShippingPartner(ctx, input.odooPartnerId, {
    shippingAddress: input.shippingAddress
      ? {
          firstName: input.shippingAddress.firstName,
          lastName: input.shippingAddress.lastName,
          line1: input.shippingAddress.line1,
          streetNumber: input.shippingAddress.streetNumber ?? '',
          isSnc: input.shippingAddress.isSnc ?? false,
          line2: input.shippingAddress.line2,
          city: input.shippingAddress.city,
          postalCode: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
          phone: input.shippingAddress.phone,
          id: input.shippingAddress.id,
        }
      : undefined,
    dropshipAddress: input.dropshipAddress,
  })
  return resolved?.odooPartnerId ?? null
}

async function postOrder(
  ctx: OdooCallContext,
  input: SaleOrderInput & {
    pwaOrderId?: string
    paymentMethod?: string | null
    chargedCents?: number | null
    snapshotAt?: string
    taxRatePct?: number
  },
): Promise<ApiV2SaleOrderResult> {
  const created = await odooApiCreateOrder(buildOrderPayload(input), ctx.correlationId)
  const result = fromApiOrder(created)
  if (input.pwaOrderId) {
    await persistOdooOrderLink(input.pwaOrderId, {
      ...result,
      odooPartnerId: input.odooPartnerId,
    })
  }
  return result
}

export function createApiV2OdooOrderAdapter(): OdooOrderAdapter {
  return {
    async createOrUpdateSaleOrder(ctx, input) {
      try {
        return await postOrder(ctx, input)
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async syncSaleOrderDraft(ctx, input: SyncSaleOrderDraftInput) {
      try {
        const partnerShippingId = await resolveShippingPartnerId(ctx, input)
        return await postOrder(ctx, {
          odooPartnerId: input.odooPartnerId,
          odooPartnerShippingId: partnerShippingId,
          odooSaleOrderId: input.odooSaleOrderId,
          clientOrderRef: input.clientOrderRef ?? `pwa-${input.pwaOrderId}`,
          orderNotes: input.orderNotes,
          courierNotes: input.courierNotes,
          lines: input.lines,
          shippingLine: input.shippingLine as SaleOrderShippingLine | null,
          currencyCode: input.currencyCode,
          pwaOrderId: input.pwaOrderId,
          paymentMethod: input.paymentMethod,
          chargedCents: input.chargedCents,
          taxRatePct: input.taxRatePct,
          snapshotAt: new Date().toISOString(),
        })
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async reconcileSaleOrderLines() {
      /* POST /orders è idempotente su client_ref: le righe si inviano alla creazione. */
    },

    async getOrderStatus(ctx, odooSaleOrderId) {
      try {
        const order = await odooApiGetOrder(odooSaleOrderId, ctx.correlationId)
        return {
          status: order.state ?? 'draft',
          paymentStatus: order.payment?.reconciliation ?? order.reconciliation?.status ?? undefined,
        }
      } catch (e) {
        wrap(e, ctx)
      }
    },
  }
}
