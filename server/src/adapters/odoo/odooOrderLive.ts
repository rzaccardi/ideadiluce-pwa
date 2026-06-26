import { parseOdooTemplateId, parseOdooVariantId } from '../../modules/catalog/odooRef.js'
import { odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'
import type {
  OdooOrderAdapter,
  SaleOrderInput,
  SaleOrderLineInput,
  SaleOrderShippingLine,
} from './odooOrderAdapter.js'
import type { SyncSaleOrderDraftInput } from '../../modules/checkout/checkout-order.types.js'
import { createOdooCustomerAdapter } from './odooCustomerAdapter.js'

let saleOrderFieldsCache: Set<string> | null = null

async function saleOrderFields(ctx: OdooCallContext): Promise<Set<string>> {
  if (saleOrderFieldsCache) return saleOrderFieldsCache
  const fields = await odooExecuteKw<Record<string, unknown>>(
    ctx,
    'sale.order',
    'fields_get',
    [],
    { attributes: ['string'] },
  )
  saleOrderFieldsCache = new Set(Object.keys(fields))
  return saleOrderFieldsCache
}

function appendOrderNoteFields(
  extraVals: Record<string, unknown>,
  fields: Set<string>,
  input: SaleOrderInput,
) {
  const orderNotes = input.orderNotes?.trim()
  if (orderNotes && fields.has('note')) {
    extraVals.note = orderNotes
  }

  const courierNotes = input.courierNotes?.trim()
  if (!courierNotes) return

  if (fields.has('delivery_note')) {
    extraVals.delivery_note = courierNotes
    return
  }
  if (fields.has('x_pwa_courier_notes')) {
    extraVals.x_pwa_courier_notes = courierNotes
    return
  }
  if (fields.has('note') && !orderNotes) {
    extraVals.note = `Consegna: ${courierNotes}`
  }
}

function appendFiscalPosition(
  extraVals: Record<string, unknown>,
  fields: Set<string>,
  input: SaleOrderInput,
) {
  const fpId = input.fiscalPositionId
  if (fpId != null && fpId > 0 && fields.has('fiscal_position_id')) {
    extraVals.fiscal_position_id = fpId
  }
}

type TemplateMini = {
  id: number
  product_variant_ids: number[]
  list_price: number
}

function nameProbeFromProductRef(productRef: string): string | null {
  if (/^\d+$/.test(productRef.trim())) return null
  const withoutId = productRef.replace(/-\d+$/, '').replace(/^p-\d+$/i, '')
  const probe = withoutId.replace(/-+/g, ' ').trim()
  return probe || null
}

async function readTemplate(
  ctx: OdooCallContext,
  domain: unknown[],
): Promise<TemplateMini | undefined> {
  const rows = await odooExecuteKw<TemplateMini[]>(
    ctx,
    'product.template',
    'search_read',
    [domain],
    { fields: ['id', 'product_variant_ids', 'list_price'], limit: 1 },
  )
  return rows[0]
}

async function variantForProductRef(
  ctx: OdooCallContext,
  productRef: string,
  variantRef?: string | null,
): Promise<{ variantId: number; priceUnit: number } | null> {
  const productId = parseOdooTemplateId(productRef)
  let row = productId != null ? await readTemplate(ctx, [['id', '=', productId]]) : undefined

  if (!row) {
    const probe = nameProbeFromProductRef(productRef)
    row = probe ? await readTemplate(ctx, [['name', 'ilike', probe]]) : undefined
  }

  if (!row) return null

  const selectedVariantId = parseOdooVariantId(variantRef)
  const vid =
    selectedVariantId != null && row.product_variant_ids?.includes(selectedVariantId)
      ? selectedVariantId
      : row.product_variant_ids?.[0]
  if (vid == null) return null
  return { variantId: vid, priceUnit: Number(row.list_price || 0) }
}

async function deliveryProductId(ctx: OdooCallContext): Promise<number | null> {
  const rows = await odooExecuteKw<Array<{ id: number }>>(
    ctx,
    'product.product',
    'search_read',
    [[['sale_ok', '=', true], ['type', '=', 'service'], ['name', 'ilike', 'Spedizione']]],
    { fields: ['id'], limit: 1 },
  )
  return rows[0]?.id ?? null
}

async function buildOrderLineCommands(
  ctx: OdooCallContext,
  lines: SaleOrderLineInput[],
  shippingLine?: SaleOrderShippingLine | null,
): Promise<unknown[]> {
  const commands: unknown[] = []
  for (const line of lines) {
    const v = await variantForProductRef(ctx, line.productRef, line.variantRef)
    if (!v) {
      throw new Error(`Prodotto Odoo non trovato per slug/ref: ${line.productRef}`)
    }
    const priceUnit = line.unitPriceCents != null ? line.unitPriceCents / 100 : v.priceUnit
    const row: Record<string, unknown> = {
      product_id: v.variantId,
      product_uom_qty: line.quantity,
      price_unit: priceUnit,
    }
    if (line.label) row.name = line.label
    commands.push([0, 0, row])
  }
  if (shippingLine && shippingLine.amountCents > 0) {
    const deliveryId = await deliveryProductId(ctx)
    if (deliveryId) {
      commands.push([
        0,
        0,
        {
          product_id: deliveryId,
          product_uom_qty: 1,
          price_unit: shippingLine.amountCents / 100,
          name: shippingLine.label,
        },
      ])
    }
  }
  return commands
}

const customerAdapter = createOdooCustomerAdapter()

async function resolveShippingPartnerId(
  ctx: OdooCallContext,
  input: SyncSaleOrderDraftInput,
): Promise<number | null> {
  if (!input.dropshipAddress) return null
  const addr = input.dropshipAddress
  const profile = {
    firstName: addr.firstName,
    lastName: addr.lastName,
    line1: addr.line1,
    streetNumber: addr.streetNumber ?? '',
    isSnc: addr.isSnc ?? false,
    line2: addr.line2,
    city: addr.city,
    postalCode: addr.postalCode,
    country: addr.country,
    phone: addr.phone,
  }
  const delivery = await customerAdapter.createDeliveryPartner(ctx, input.odooPartnerId, profile)
  return delivery.odooPartnerId
}

export function createLiveOdooOrderAdapter(): OdooOrderAdapter {
  const adapter: OdooOrderAdapter = {
    async syncSaleOrderDraft(ctx, input) {
      const partnerShippingId = await resolveShippingPartnerId(ctx, input)
      const clientRef =
        input.clientOrderRef?.trim() ||
        (input.pwaOrderId && input.pwaOrderId !== 'new' ? `PWA ${input.pwaOrderId}` : undefined)
      return adapter.createOrUpdateSaleOrder(ctx, {
        odooPartnerId: input.odooPartnerId,
        odooPartnerShippingId: partnerShippingId,
        odooSaleOrderId: input.odooSaleOrderId,
        clientOrderRef: clientRef,
        orderNotes: input.orderNotes,
        courierNotes: input.courierNotes,
        fiscalPositionId: input.fiscal?.fiscalPositionId ?? null,
        currencyCode: input.currencyCode,
        lines: input.lines,
        shippingLine: input.shippingLine,
      })
    },

    async createOrUpdateSaleOrder(ctx: OdooCallContext, input: SaleOrderInput) {
      const lineCommands = await buildOrderLineCommands(ctx, input.lines, input.shippingLine)
      if (lineCommands.length === 0) {
        throw new Error('Nessuna riga ordine valida')
      }

      const extraVals: Record<string, unknown> = {}
      if (input.clientOrderRef?.trim()) {
        extraVals.client_order_ref = input.clientOrderRef.trim()
      }
      const fields = await saleOrderFields(ctx)
      appendOrderNoteFields(extraVals, fields, input)
      appendFiscalPosition(extraVals, fields, input)

      const existingId = input.odooSaleOrderId
      if (existingId != null && existingId > 0) {
        const rows = await odooExecuteKw<Array<{ state: string }>>(
          ctx,
          'sale.order',
          'read',
          [[existingId]],
          { fields: ['state'] },
        )
        const state = rows[0]?.state
        if (state && ['draft', 'sent'].includes(state)) {
          await odooExecuteKw<boolean>(
            ctx,
            'sale.order',
            'write',
            [
              [existingId],
              {
                partner_id: input.odooPartnerId,
                ...(input.odooPartnerShippingId
                  ? { partner_shipping_id: input.odooPartnerShippingId }
                  : {}),
                ...extraVals,
                order_line: [[5, 0, 0], ...lineCommands],
              },
            ],
            {},
          )
          return { odooSaleOrderId: existingId }
        }
      }

      const vals = {
        partner_id: input.odooPartnerId,
        ...(input.odooPartnerShippingId ? { partner_shipping_id: input.odooPartnerShippingId } : {}),
        order_line: lineCommands,
        ...extraVals,
      }
      const created = await odooExecuteKw<unknown>(ctx, 'sale.order', 'create', [vals], {})

      const odooSaleOrderId = normalizeOdooCreateId(created)
      return { odooSaleOrderId }
    },

    async reconcileSaleOrderLines(ctx, odooSaleOrderId, lines, shippingLine) {
      const lineCommands = await buildOrderLineCommands(ctx, lines, shippingLine)
      if (lineCommands.length === 0) {
        throw new Error('Nessuna riga ordine valida per riconciliazione')
      }
      await odooExecuteKw<boolean>(
        ctx,
        'sale.order',
        'write',
        [[odooSaleOrderId], { order_line: [[5, 0, 0], ...lineCommands] }],
        {},
      )
    },

    async getOrderStatus(ctx: OdooCallContext, odooSaleOrderId: number) {
      const rows = await odooExecuteKw<Array<{ state: string }>>(
        ctx,
        'sale.order',
        'read',
        [[odooSaleOrderId]],
        { fields: ['state'] },
      )
      const row = rows[0]
      return {
        status: row?.state ?? 'unknown',
        paymentStatus: undefined,
      }
    },
  }
  return adapter
}
