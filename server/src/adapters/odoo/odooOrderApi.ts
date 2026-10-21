import { createHash } from 'node:crypto'
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
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'

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

/** Fingerprint righe+spedizione (utile per confronti cart; non va in `tlb_hl_ref`). */
export function checkoutLinesFingerprint(
  lines: Array<{ product_id: number; qty: number; price_unit_net?: number }>,
  shipping: { carrier: string; amount_net: number } | null | undefined,
): string {
  const payload = JSON.stringify({
    lines: lines.map((l) => ({ p: l.product_id, q: l.qty, u: l.price_unit_net ?? null })),
    shipping: shipping ? { c: shipping.carrier, a: shipping.amount_net } : null,
  })
  return createHash('sha256').update(payload).digest('hex').slice(0, 10)
}

function buildOrderPayload(
  input: SaleOrderInput & {
    pwaOrderId?: string
    paymentMethod?: string | null
    chargedCents?: number | null
    snapshotAt?: string
    taxRatePct?: number
    pricedFromCache?: boolean
  },
): OdooApiOrderWrite {
  const pricedFromCache = Boolean(input.pricedFromCache)
  const lines = input.lines
    .map((line) => {
      const productId = resolveVariantProductId(line)
      if (productId == null) return null
      const row: {
        product_id: number
        qty: number
        price_unit_net?: number
      } = {
        product_id: productId,
        qty: line.quantity,
      }
      // price_unit_net solo obbligatorio con priced_from_cache; Odoo calcola altrimenti.
      if (pricedFromCache) {
        if (line.unitPriceCents == null) return null
        row.price_unit_net = netEurosFromNetCents(line.unitPriceCents)
      }
      return row
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

  const shipping =
    input.shippingLine != null
      ? {
          carrier: mapOdooApiCarrier(input.shippingLine),
          amount_net: netEurosFromCents(input.shippingLine.amountCents, input.taxRatePct ?? 22),
          label: input.shippingLine.label,
        }
      : null

  // `tlb_hl_ref` stabile per ordine PWA: usato per riprendere il SO dell’utente (niente client_ref).
  const tlbHlRef = input.pwaOrderId
    ? `pwa-${input.pwaOrderId}`
    : input.clientOrderRef?.trim() || ''
  if (!tlbHlRef) {
    throw new AppError(
      'ODOO_TLB_HL_REF_MISSING',
      'tlb_hl_ref missing',
      'Riferimento ordine PWA assente.',
      400,
      false,
    )
  }

  const payload: OdooApiOrderWrite = {
    tlb_hl_ref: tlbHlRef,
    customer_id: input.odooPartnerId,
    currency: input.currencyCode || 'EUR',
    lines,
    payment: { method: mapOdooApiPaymentMethod(input.paymentMethod) },
  }

  if (input.odooPartnerShippingId) payload.shipping_address_id = input.odooPartnerShippingId
  const invoiceId = (input as { odooPartnerInvoiceId?: number | null }).odooPartnerInvoiceId
  if (invoiceId) payload.invoice_address_id = invoiceId

  if (shipping) {
    payload.shipping = {
      carrier: shipping.carrier,
      amount_net: shipping.amount_net,
      label: shipping.label,
    }
  }

  if (input.chargedCents != null || input.snapshotAt || pricedFromCache) {
    payload.pricing = {
      ...(input.snapshotAt ? { snapshot_at: input.snapshotAt } : {}),
      ...(input.chargedCents != null ? { charged_cents: input.chargedCents } : {}),
      ...(pricedFromCache ? { priced_from_cache: true } : {}),
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
          province: input.shippingAddress.province,
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
    pricedFromCache?: boolean
  },
): Promise<ApiV2SaleOrderResult> {
  const payload = buildOrderPayload(input)
  const created = await odooApiCreateOrder(payload, ctx.correlationId)
  const result = fromApiOrder(created)

  if (input.chargedCents != null && Number.isFinite(input.chargedCents)) {
    const odooGross =
      created.totals?.gross_cents ??
      (typeof created.totals?.gross === 'number' ? Math.round(created.totals.gross * 100) : null)
    if (odooGross != null && Math.abs(odooGross - input.chargedCents) > 1) {
      logger.warn('odoo.api_v2.order_total_mismatch', {
        correlationId: ctx.correlationId,
        pwaOrderId: input.pwaOrderId ?? null,
        odooSaleOrderId: result.odooSaleOrderId,
        tlbHlRef: payload.tlb_hl_ref,
        chargedCents: input.chargedCents,
        odooGrossCents: odooGross,
      })
    }
  }

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
          pricedFromCache: input.pricedFromCache,
        })
      } catch (e) {
        wrap(e, ctx)
      }
    },

    async reconcileSaleOrderLines(ctx, odooSaleOrderId, lines, shippingLine) {
      // Idempotenza su `tlb_hl_ref` stabile (`pwa-<id>`): Odoo deve aggiornare il SO esistente.
      try {
        const existing = await odooApiGetOrder(odooSaleOrderId, ctx.correlationId)
        const partnerId = existing.customer?.id
        if (partnerId == null || partnerId <= 0) {
          throw new AppError(
            'ODOO_PARTNER_MISSING',
            'Missing customer on Odoo order',
            'Cliente Odoo assente sull’ordine da riconciliare.',
            409,
            true,
          )
        }
        const linked = await prisma.pwaOrder.findFirst({
          where: { odooSaleOrderId },
          select: { id: true, clientOrderRef: true },
        })
        await postOrder(ctx, {
          odooPartnerId: partnerId,
          odooSaleOrderId,
          clientOrderRef:
            linked?.clientOrderRef ??
            existing.tlb_hl_ref ??
            existing.client_ref ??
            `pwa-reconcile-${odooSaleOrderId}`,
          lines,
          shippingLine: shippingLine ?? null,
          currencyCode: existing.currency ?? 'EUR',
          pwaOrderId: linked?.id,
        })
      } catch (e) {
        wrap(e, ctx)
      }
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
