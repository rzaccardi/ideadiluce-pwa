import { odooExecuteKw, isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { logger } from '../../lib/logger.js'
import type { OrderLineDTO } from '../../types/dto.js'
import { resolveOdooCatalogProductLabels } from '../catalog/odoo-product-labels.js'
import { odooSalesService } from '../odoo/odoo-sales.service.js'
import type { OdooSaleOrderLineDTO } from '../odoo/odoo-sales.types.js'

export type OdooLineProductExtra = {
  defaultCode: string | null
  templateId: number | null
  slug: string | null
  name: string | null
  imageUrl: string | null
}

function textOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function many2OneId(value: unknown): number | null {
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0]
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  return null
}

export function mapOdooSaleLinesToOrderLines(
  lines: readonly OdooSaleOrderLineDTO[],
  products: ReadonlyMap<number, OdooLineProductExtra> = new Map(),
): OrderLineDTO[] {
  return lines
    .filter((line) => line.quantity > 0)
    .map((line) => {
      const extra = line.productId != null ? products.get(line.productId) : undefined
      const sku = extra?.defaultCode ?? null
      const productRef =
        sku ?? (line.productId != null ? String(line.productId) : `odoo-line-${line.id}`)
      return {
        productRef,
        variantRef: line.productId != null ? String(line.productId) : null,
        quantity: line.quantity,
        productSlug: extra?.slug ?? null,
        productName: extra?.name ?? line.productName,
        imageUrl: extra?.imageUrl ?? null,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.subtotalCents,
      }
    })
}

async function loadProductExtras(
  ctx: OdooCallContext,
  productIds: number[],
): Promise<Map<number, OdooLineProductExtra>> {
  const extras = new Map<number, OdooLineProductExtra>()
  if (productIds.length === 0) return extras

  try {
    const rows = await odooExecuteKw<
      Array<{ id: number; default_code?: unknown; product_tmpl_id?: unknown }>
    >(ctx, 'product.product', 'read', [productIds], {
      fields: ['default_code', 'product_tmpl_id'],
    })
    for (const row of rows) {
      extras.set(row.id, {
        defaultCode: textOrNull(row.default_code),
        templateId: many2OneId(row.product_tmpl_id),
        slug: null,
        name: null,
        imageUrl: null,
      })
    }
  } catch (err) {
    logger.warn('orders.odoo_line_products_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  const templateIds = [
    ...new Set(
      [...extras.values()]
        .map((extra) => extra.templateId)
        .filter((id): id is number => id != null),
    ),
  ]
  if (templateIds.length === 0) return extras

  const labels = await resolveOdooCatalogProductLabels(templateIds.map(String))
  for (const [productId, extra] of extras) {
    if (extra.templateId == null) continue
    const label = labels.get(String(extra.templateId))
    if (!label) continue
    extras.set(productId, {
      ...extra,
      slug: label.slug,
      name: label.name,
      imageUrl: label.imageUrl,
    })
  }

  return extras
}

export async function loadOdooOrderLines(
  odooSaleOrderId: number,
  correlationId: string,
): Promise<OrderLineDTO[]> {
  if (!isOdooConfigured()) return []

  const ctx: OdooCallContext = { correlationId: `${correlationId}:odoo-lines` }
  try {
    const lines = (await odooSalesService.getOrderLines(
      ctx,
      odooSaleOrderId,
    )) as OdooSaleOrderLineDTO[]
    const productIds = [
      ...new Set(
        lines.map((line) => line.productId).filter((id): id is number => id != null),
      ),
    ]
    const extras = await loadProductExtras(ctx, productIds)
    return mapOdooSaleLinesToOrderLines(lines, extras)
  } catch (err) {
    logger.warn('orders.odoo_lines_failed', {
      odooSaleOrderId,
      error: err instanceof Error ? err.message : String(err),
    })
    return []
  }
}
