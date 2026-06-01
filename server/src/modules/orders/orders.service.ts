import { AppError } from '../../types/errors.js'
import type { OrderDTO } from '../../types/dto.js'
import { ordersRepository } from './orders.repository.js'
import { prisma } from '../../lib/prisma.js'

function portalFromSnapshot(snapshotJson: unknown): string | null {
  if (!snapshotJson || typeof snapshotJson !== 'object') return null
  const url = (snapshotJson as { odooPortalUrl?: string }).odooPortalUrl
  return typeof url === 'string' ? url : null
}

function mapRow(r: {
  id: string
  odooSaleOrderId: number
  status: string
  paymentStatus: string | null
  currencyCode: string | null
  totalAmount: number | null
  createdAt: Date
  snapshotJson: unknown
}): OrderDTO {
  const snap = r.snapshotJson
  const pwaOrderId =
    snap && typeof snap === 'object' && 'pwaOrderId' in snap
      ? String((snap as { pwaOrderId: string }).pwaOrderId)
      : r.id.startsWith('pwa-')
        ? r.id.replace(/^pwa-/, '')
        : null
  return {
    id: r.id,
    pwaOrderId,
    odooSaleOrderId: r.odooSaleOrderId,
    status: r.status,
    paymentStatus: r.paymentStatus,
    currencyCode: r.currencyCode,
    totalAmount: r.totalAmount,
    createdAt: r.createdAt.toISOString(),
    odooPortalUrl: portalFromSnapshot(snap),
  }
}

export const ordersService = {
  async list(userId: string): Promise<OrderDTO[]> {
    const rows = await ordersRepository.listByUser(userId)
    const fromCache = rows.map(mapRow)

    const pwaOrders = await prisma.pwaOrder.findMany({
      where: { userId, orderStatus: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] } },
      orderBy: { paidAt: 'desc' },
      take: 50,
    })

    const cacheOdooIds = new Set(fromCache.map((o) => o.odooSaleOrderId))
    for (const po of pwaOrders) {
      if (po.odooSaleOrderId && !cacheOdooIds.has(po.odooSaleOrderId)) {
        fromCache.push({
          id: `pwa-${po.id}`,
          pwaOrderId: po.id,
          odooSaleOrderId: po.odooSaleOrderId,
          status: po.orderStatus.toLowerCase(),
          paymentStatus: po.paymentStatus.toLowerCase(),
          currencyCode: po.currencyCode,
          totalAmount: po.amountTotal,
          createdAt: (po.paidAt ?? po.createdAt).toISOString(),
          odooPortalUrl: null,
        })
      }
    }

    return fromCache.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async getById(userId: string, id: string): Promise<OrderDTO> {
    const row = await ordersRepository.findForUser(userId, id)
    if (row) return mapRow(row)

    const pwaId = id.startsWith('pwa-') ? id.replace(/^pwa-/, '') : id
    const po = await prisma.pwaOrder.findFirst({
      where: {
        id: pwaId,
        userId,
        orderStatus: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
      },
    })
    if (!po || !po.odooSaleOrderId) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }

    const cache = await prisma.orderCache.findUnique({ where: { id: `pwa-${po.id}` } })
    return {
      id: `pwa-${po.id}`,
      pwaOrderId: po.id,
      odooSaleOrderId: po.odooSaleOrderId,
      status: po.orderStatus.toLowerCase(),
      paymentStatus: po.paymentStatus.toLowerCase(),
      currencyCode: po.currencyCode,
      totalAmount: po.amountTotal,
      createdAt: (po.paidAt ?? po.createdAt).toISOString(),
      odooPortalUrl: cache ? portalFromSnapshot(cache.snapshotJson) : null,
    }
  },
}
