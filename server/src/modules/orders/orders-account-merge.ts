import type { PwaOrder } from '@prisma/client'
import type { OrderDTO } from '../../types/dto.js'
import { accountOrderPublicId } from './orders-account-id.js'
import { formatDisplayOrderNumber } from './order-display-number.js'
import { OPEN_RETURN_WINDOW } from './order-return-window.js'

export function mapPwaOrderRow(po: PwaOrder): OrderDTO | null {
  if (!po.odooSaleOrderId && po.paymentStatus !== 'CAPTURED' && po.orderStatus !== 'PAYMENT_PENDING') {
    return null
  }
  const createdAt = (po.paidAt ?? po.createdAt).toISOString()
  return {
    id: accountOrderPublicId(po),
    pwaOrderId: po.id,
    odooSaleOrderId: po.odooSaleOrderId ?? 0,
    orderNumber: formatDisplayOrderNumber({ ...po, createdAt }),
    status: po.orderStatus.toLowerCase(),
    paymentStatus: po.paymentStatus.toLowerCase(),
    currencyCode: po.currencyCode,
    totalAmount: po.amountTotal,
    createdAt,
    odooPortalUrl: null,
    source: 'pwa',
    sourceLabel: 'E-commerce',
    returnRequest: null,
    shipment: null,
    returnWindow: OPEN_RETURN_WINDOW,
  }
}

/** Allinea la lista account allo stato PWA: un bonifico pending non resta "sale/confermato". */
export function mergePwaOrdersIntoList(fromCache: OrderDTO[], pwaOrders: PwaOrder[]): void {
  const byPwaId = new Map<string, OrderDTO>()
  const byOdooId = new Map<number, OrderDTO>()
  for (const item of fromCache) {
    if (item.pwaOrderId) byPwaId.set(item.pwaOrderId, item)
    if (item.odooSaleOrderId) byOdooId.set(item.odooSaleOrderId, item)
  }

  for (const po of pwaOrders) {
    const mapped = mapPwaOrderRow(po)
    if (!mapped) continue

    const existing =
      byPwaId.get(po.id) ?? (po.odooSaleOrderId ? byOdooId.get(po.odooSaleOrderId) : undefined)

    if (existing) {
      if (po.orderStatus === 'PAYMENT_PENDING' || po.orderStatus === 'PAYMENT_FAILED') {
        existing.status = mapped.status
        existing.paymentStatus = mapped.paymentStatus
      }
      existing.pwaOrderId = mapped.pwaOrderId
      existing.id = mapped.id
      existing.orderNumber = mapped.orderNumber
      continue
    }

    fromCache.push(mapped)
    byPwaId.set(po.id, mapped)
    if (po.odooSaleOrderId) byOdooId.set(po.odooSaleOrderId, mapped)
  }
}
