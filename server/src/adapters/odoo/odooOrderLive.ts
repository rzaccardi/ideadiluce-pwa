import { odooExecuteKw, type OdooCallContext } from './odooClient.js'
import { normalizeOdooCreateId } from './odooId.js'
import type {
  OdooOrderAdapter,
  SaleOrderInput,
  SaleOrderLineInput,
  SaleOrderShippingLine,
} from './odooOrderAdapter.js'

type TemplateMini = {
  id: number
  product_variant_ids: number[]
  list_price: number
}

function idFromProductRef(productRef: string): number | null {
  const match = /-(\d+)$/.exec(productRef) ?? /^p-(\d+)$/.exec(productRef)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function idFromVariantRef(variantRef: string | null | undefined): number | null {
  const match = variantRef ? /^VAR-(\d+)$/.exec(variantRef) : null
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function nameProbeFromProductRef(productRef: string): string | null {
  const withoutId = productRef.replace(/-\d+$/, '').replace(/^p-\d+$/, '')
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
  const productId = idFromProductRef(productRef)
  let row = productId != null ? await readTemplate(ctx, [['id', '=', productId]]) : undefined

  if (!row) {
    const probe = nameProbeFromProductRef(productRef)
    row = probe ? await readTemplate(ctx, [['name', 'ilike', probe]]) : undefined
  }

  if (!row) return null

  const selectedVariantId = idFromVariantRef(variantRef)
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

export function createLiveOdooOrderAdapter(): OdooOrderAdapter {
  return {
    async createOrUpdateSaleOrder(ctx: OdooCallContext, input: SaleOrderInput) {
      const lineCommands = await buildOrderLineCommands(ctx, input.lines, input.shippingLine)
      if (lineCommands.length === 0) {
        throw new Error('Nessuna riga ordine valida')
      }

      const vals = {
        partner_id: input.odooPartnerId,
        order_line: lineCommands,
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
}
