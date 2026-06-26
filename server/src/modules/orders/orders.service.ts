import { AppError } from '../../types/errors.js'
import type { OrderDetailDTO, OrderDTO, OrderLineDTO, OrderReorderResultDTO, ProductCardDTO, InvoiceDTO } from '../../types/dto.js'
import { ordersRepository } from './orders.repository.js'
import { prisma } from '../../lib/prisma.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { odooSalesService } from '../odoo/odoo-sales.service.js'
import type { OdooSaleDocumentDTO } from '../odoo/odoo-sales.types.js'
import { logger } from '../../lib/logger.js'
import { loadPwaOrderLines } from './pwa-order-lines.js'
import { cartService } from '../cart/cart.service.js'
import type { Request } from 'express'

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
    source: 'pwa',
    sourceLabel: 'E-commerce',
  }
}

function mapOdooOrder(r: OdooSaleDocumentDTO): OrderDTO {
  return {
    id: `odoo-${r.id}`,
    pwaOrderId: null,
    odooSaleOrderId: r.id,
    status: r.state,
    paymentStatus: r.invoiceStatus,
    currencyCode: r.currencyCode,
    totalAmount: r.amountTotalCents,
    createdAt: r.dateOrder ?? new Date(0).toISOString(),
    odooPortalUrl: null,
    source: r.source,
    sourceLabel: r.sourceLabel,
  }
}

async function listOdooOrdersForUser(
  userId: string,
  ctx: OdooCallContext,
): Promise<OrderDTO[]> {
  if (!isOdooConfigured()) return []

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  if (!user) return []

  const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })
  const query =
    map != null
      ? { page: 1, pageSize: 50, partnerId: map.odooPartnerId }
      : { page: 1, pageSize: 50, email: user.email }

  try {
    const result = await odooSalesService.listConfirmedOrders(ctx, query)
    return result.items.map(mapOdooOrder)
  } catch (e) {
    logger.warn('orders.odoo_history_failed', { userId, err: String(e) })
    return []
  }
}

function enrichOrderDetail(base: OrderDTO, lines: OrderLineDTO[]): OrderDetailDTO {
  const lineCount = lines.reduce((n, l) => n + l.quantity, 0)
  return {
    ...base,
    lines,
    lineCount,
    isSingleItem: lines.length === 1 && lines[0]?.quantity === 1,
  }
}

async function findOwnedPwaOrder(userId: string, id: string) {
  const pwaId = id.startsWith('pwa-') ? id.replace(/^pwa-/, '') : id
  return prisma.pwaOrder.findFirst({
    where: {
      id: pwaId,
      userId,
      orderStatus: { in: ['PAID', 'CONFIRMED', 'COMPLETED'] },
    },
  })
}

function normalizePwaOrderId(id: string) {
  return id.startsWith('pwa-') ? id.replace(/^pwa-/, '') : id
}

async function findAccessiblePwaOrder(req: Request, userId: string, id: string) {
  const pwaId = normalizePwaOrderId(id)
  const sessionId = req.sessionRecord?.id
  return prisma.pwaOrder.findFirst({
    where: {
      id: pwaId,
      OR: [{ userId }, ...(sessionId ? [{ sessionId }] : [])],
    },
  })
}

export const ordersService = {
  async list(userId: string, correlationId = 'orders-list'): Promise<OrderDTO[]> {
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
          source: 'pwa',
          sourceLabel: 'E-commerce',
        })
      }
    }

    const seenOdooIds = new Set(fromCache.map((o) => o.odooSaleOrderId))
    const liveOdoo = await listOdooOrdersForUser(userId, { correlationId })
    for (const order of liveOdoo) {
      if (!seenOdooIds.has(order.odooSaleOrderId)) {
        fromCache.push(order)
        seenOdooIds.add(order.odooSaleOrderId)
      }
    }

    return fromCache.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  },

  async getById(userId: string, id: string, correlationId = 'orders-detail'): Promise<OrderDetailDTO> {
    if (id.startsWith('odoo-')) {
      const order = (await this.list(userId, correlationId)).find((o) => o.id === id)
      if (order) return enrichOrderDetail(order, [])
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }

    const row = await ordersRepository.findForUser(userId, id)
    if (row) {
      const base = mapRow(row)
      const pwaId = base.pwaOrderId ?? (base.id.startsWith('pwa-') ? base.id.replace(/^pwa-/, '') : null)
      const lines = pwaId ? await loadPwaOrderLines(pwaId) : []
      return enrichOrderDetail(base, lines)
    }

    const po = await findOwnedPwaOrder(userId, id)
    if (!po || !po.odooSaleOrderId) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }

    const cache = await prisma.orderCache.findUnique({ where: { id: `pwa-${po.id}` } })
    const base: OrderDTO = {
      id: `pwa-${po.id}`,
      pwaOrderId: po.id,
      odooSaleOrderId: po.odooSaleOrderId,
      status: po.orderStatus.toLowerCase(),
      paymentStatus: po.paymentStatus.toLowerCase(),
      currencyCode: po.currencyCode,
      totalAmount: po.amountTotal,
      createdAt: (po.paidAt ?? po.createdAt).toISOString(),
      odooPortalUrl: cache ? portalFromSnapshot(cache.snapshotJson) : null,
      source: 'pwa',
      sourceLabel: 'E-commerce',
    }
    const lines = await loadPwaOrderLines(po.id)
    return enrichOrderDetail(base, lines)
  },

  async reorder(req: Request, userId: string, id: string): Promise<OrderReorderResultDTO> {
    const po = await findOwnedPwaOrder(userId, id)
    if (!po) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }
    const lines = await loadPwaOrderLines(po.id)
    if (lines.length === 0) {
      throw new AppError('ORDER_EMPTY', 'No lines', 'Nessuna riga da riordinare.', 400, false)
    }
    return cartService.reorderLines(
      req,
      lines.map((l) => ({
        productRef: l.productRef,
        variantRef: l.variantRef,
        quantity: l.quantity,
      })),
    )
  },

  async recommendations(req: Request, userId: string, id: string): Promise<ProductCardDTO[]> {
    const po = await findAccessiblePwaOrder(req, userId, id)
    if (!po) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }
    const lines = await loadPwaOrderLines(po.id)
    const slugs = [...new Set(lines.map((l) => l.productSlug ?? l.productRef).filter(Boolean))]
    return cartService.recommendationsForSlugs(req, slugs)
  },

  async listInvoices(userId: string, correlationId = 'invoices-list'): Promise<InvoiceDTO[]> {
    const { invoicesService } = await import('../invoices/invoices.service.js')
    return invoicesService.list(userId, correlationId)
  },
}
