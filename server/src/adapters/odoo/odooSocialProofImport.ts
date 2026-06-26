import { prisma } from '../../lib/prisma.js'
import { anonymizePartnerDisplayName } from '../../modules/social-proof/social-proof.anonymize.js'
import { assertOdooConfigured, isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'

type OdooLineRow = {
  id: number
  product_uom_qty: number
  product_id: [number, string] | number | false
  order_id: [number, string] | number | false
}

type OdooOrderRow = {
  id: number
  date_order: string
  partner_id: [number, string] | number | false
}

type OdooProductRow = {
  id: number
  product_tmpl_id: [number, string] | number
}

function relationId(value: [number, string] | number | false | undefined): number | null {
  if (value === false || value == null) return null
  return Array.isArray(value) ? value[0] : value
}

function relationName(value: [number, string] | number | false | undefined): string | null {
  if (!Array.isArray(value)) return null
  return value[1] ?? null
}

export async function importSocialProofFromOdoo(
  ctx: OdooCallContext,
  lookbackDays: number,
): Promise<{ imported: number; deletedStale: number }> {
  assertOdooConfigured()
  const since = new Date(Date.now() - lookbackDays * 86_400_000)
  const sinceOdoo = since.toISOString().slice(0, 19).replace('T', ' ')

  const deletedStale = await prisma.socialProofOdooEvent.deleteMany({
    where: { purchasedAt: { lt: since } },
  })

  const domain: unknown[] = [
    ['order_id.state', 'in', ['sale', 'done']],
    ['order_id.date_order', '>=', sinceOdoo],
  ]

  const BATCH = 200
  let offset = 0
  let imported = 0

  for (;;) {
    const lines = await odooExecuteKw<OdooLineRow[]>(
      ctx,
      'sale.order.line',
      'search_read',
      [domain],
      {
        fields: ['id', 'product_uom_qty', 'product_id', 'order_id'],
        order: 'id desc',
        limit: BATCH,
        offset,
      },
    )
    if (lines.length === 0) break

    const orderIds = [
      ...new Set(lines.map((l) => relationId(l.order_id)).filter((id): id is number => id != null)),
    ]
    const productIds = [
      ...new Set(lines.map((l) => relationId(l.product_id)).filter((id): id is number => id != null)),
    ]

    const [orders, products] = await Promise.all([
      orderIds.length
        ? odooExecuteKw<OdooOrderRow[]>(ctx, 'sale.order', 'read', [orderIds], {
            fields: ['id', 'date_order', 'partner_id'],
          })
        : Promise.resolve([]),
      productIds.length
        ? odooExecuteKw<OdooProductRow[]>(ctx, 'product.product', 'read', [productIds], {
            fields: ['id', 'product_tmpl_id'],
          })
        : Promise.resolve([]),
    ])

    const orderById = new Map(orders.map((o) => [o.id, o]))
    const tmplByProductId = new Map(
      products.map((p) => [p.id, relationId(p.product_tmpl_id)] as const),
    )

    for (const line of lines) {
      const orderId = relationId(line.order_id)
      const productId = relationId(line.product_id)
      const templateId = productId != null ? tmplByProductId.get(productId) : null
      const order = orderId != null ? orderById.get(orderId) : undefined
      if (!orderId || !templateId || !order?.date_order) continue

      const qty = Math.round(Number(line.product_uom_qty) || 0)
      if (qty < 1) continue

      const purchasedAt = new Date(order.date_order)
      if (Number.isNaN(purchasedAt.getTime())) continue

      const buyerLabel = anonymizePartnerDisplayName(relationName(order.partner_id))

      await prisma.socialProofOdooEvent.upsert({
        where: { odooLineId: line.id },
        create: {
          odooLineId: line.id,
          odooSaleOrderId: orderId,
          productTemplateId: templateId,
          quantity: qty,
          purchasedAt,
          buyerLabel,
        },
        update: {
          odooSaleOrderId: orderId,
          productTemplateId: templateId,
          quantity: qty,
          purchasedAt,
          buyerLabel,
          syncedAt: new Date(),
        },
      })
      imported += 1
    }

    offset += lines.length
    if (lines.length < BATCH || offset > 10_000) break
  }

  return { imported, deletedStale: deletedStale.count }
}

export function odooSocialProofAvailable(): boolean {
  return isOdooConfigured()
}
