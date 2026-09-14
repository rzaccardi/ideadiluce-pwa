import type { PwaOrder } from '@prisma/client'
import { ODOO_ORDER_SOURCE_LABEL } from '../odoo/odoo-order-source.js'
import type { OrderDTO } from '../../types/dto.js'
import { formatDisplayOrderNumber } from './order-display-number.js'

export function isOdooOrderPublicName(id: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(id.trim())
}

export function accountOrderPublicId(po: Pick<PwaOrder, 'id' | 'odooSaleOrderName'>): string {
  const name = po.odooSaleOrderName?.trim()
  if (name) return name
  return `pwa-${po.id}`
}

export function applyPwaOrderPublicIds(
  list: OrderDTO[],
  pwaOrders: Array<Pick<PwaOrder, 'id' | 'odooSaleOrderId' | 'odooSaleOrderName'>>,
): void {
  const byPwaId = new Map(pwaOrders.map((po) => [po.id, po]))
  const byOdooId = new Map(
    pwaOrders
      .filter((po): po is typeof po & { odooSaleOrderId: number } => po.odooSaleOrderId != null)
      .map((po) => [po.odooSaleOrderId, po]),
  )
  for (const order of list) {
    const po =
      (order.pwaOrderId ? byPwaId.get(order.pwaOrderId) : undefined) ??
      (order.odooSaleOrderId ? byOdooId.get(order.odooSaleOrderId) : undefined)
    if (!po) continue
    order.id = accountOrderPublicId(po)
    order.orderNumber = formatDisplayOrderNumber(po)
    if (!order.pwaOrderId) order.pwaOrderId = po.id
    if (order.source === 'odoo_historical' || order.source === 'odoo_manual') {
      order.source = 'pwa'
      order.sourceLabel = ODOO_ORDER_SOURCE_LABEL.pwa
    }
  }
}
