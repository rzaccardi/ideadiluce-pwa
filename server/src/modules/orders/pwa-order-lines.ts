import { prisma } from '../../lib/prisma.js'
import type { OrderLineDTO } from '../../types/dto.js'
import { resolveOdooCatalogProductLabels } from '../catalog/odoo-product-labels.js'

export async function loadPwaOrderLines(pwaOrderId: string): Promise<OrderLineDTO[]> {
  const po = await prisma.pwaOrder.findUnique({
    where: { id: pwaOrderId },
    include: { cart: { include: { items: true } } },
  })
  if (!po?.cart?.items.length) return []

  const labels = await resolveOdooCatalogProductLabels(po.cart.items.map((i) => i.productRef))
  return po.cart.items.map((line) => {
    const info = labels.get(line.productRef)
    const unit = line.clientUnitPriceEstimate
    return {
      productRef: line.productRef,
      variantRef: line.variantRef,
      quantity: line.quantity,
      productSlug: info?.slug ?? null,
      productName: info?.name ?? line.productRef,
      imageUrl: info?.imageUrl ?? null,
      unitPriceCents: unit,
      lineTotalCents: unit != null ? unit * line.quantity : null,
    }
  })
}
