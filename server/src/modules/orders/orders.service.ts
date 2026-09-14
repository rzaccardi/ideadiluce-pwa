import { AppError } from '../../types/errors.js'
import type { OrderDetailDTO, OrderDTO, OrderLineDTO, OrderReorderResultDTO, ProductCardDTO, InvoiceDTO } from '../../types/dto.js'
import { ordersRepository } from './orders.repository.js'
import { prisma } from '../../lib/prisma.js'
import { isOdooConfigured, isOdooLiveConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { isOdooApiV2Configured } from '../../adapters/odoo-api/odooApiClient.js'
import { odooApiGetOrder, odooApiListOrders } from '../../adapters/odoo-api/odooApi.resources.js'
import type { OdooApiOrder } from '../../adapters/odoo-api/odooApi.types.js'
import { odooSalesService } from '../odoo/odoo-sales.service.js'
import type { OdooSaleDocumentDTO } from '../odoo/odoo-sales.types.js'
import { logger } from '../../lib/logger.js'
import { loadOdooOrderLines } from './odoo-order-lines.js'
import { loadPwaOrderLines } from './pwa-order-lines.js'
import { cartService } from '../cart/cart.service.js'
import type { Request } from 'express'
import { ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } from './orders.constants.js'
import { buildAccountPwaOrderWhere } from './orders-account-query.js'
import { accountOrderPublicId, applyPwaOrderPublicIds, isOdooOrderPublicName } from './orders-account-id.js'
import { mapPwaOrderRow, mergePwaOrdersIntoList } from './orders-account-merge.js'
import { formatDisplayOrderNumber } from './order-display-number.js'
import { linkOrdersToUser } from './orders-user-link.service.js'
import { orderReturnRequestService } from './order-return-request.service.js'
import { OPEN_RETURN_WINDOW, orderShipmentService } from './order-shipment.service.js'

function portalFromSnapshot(snapshotJson: unknown): string | null {
  if (!snapshotJson || typeof snapshotJson !== 'object') return null
  const url = (snapshotJson as { odooPortalUrl?: string }).odooPortalUrl
  return typeof url === 'string' ? url : null
}

function nameFromSnapshot(snapshotJson: unknown): string | null {
  if (!snapshotJson || typeof snapshotJson !== 'object') return null
  const name = (snapshotJson as { odooSaleOrderName?: unknown }).odooSaleOrderName
  return typeof name === 'string' && name.trim() ? name.trim() : null
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
  const createdAt = r.createdAt.toISOString()
  const odooSaleOrderName = nameFromSnapshot(snap)
  return {
    id: r.id,
    pwaOrderId,
    odooSaleOrderId: r.odooSaleOrderId,
    orderNumber: formatDisplayOrderNumber({
      id: r.id,
      odooSaleOrderId: r.odooSaleOrderId,
      odooSaleOrderName,
      createdAt,
    }),
    status: r.status,
    paymentStatus: r.paymentStatus,
    currencyCode: r.currencyCode,
    totalAmount: r.totalAmount,
    createdAt,
    odooPortalUrl: portalFromSnapshot(snap),
    source: 'pwa',
    sourceLabel: 'E-commerce',
    returnRequest: null,
    shipment: null,
    returnWindow: OPEN_RETURN_WINDOW,
  }
}

function mapApiOrder(order: OdooApiOrder): OrderDTO {
  const id = order.name || `odoo-${order.id}`
  const createdAt = order.date_order ? new Date(order.date_order).toISOString() : new Date(0).toISOString()
  return {
    id,
    pwaOrderId: null,
    odooSaleOrderId: order.id,
    orderNumber: formatDisplayOrderNumber({
      id,
      odooSaleOrderId: order.id,
      odooSaleOrderName: order.name,
      createdAt,
    }),
    status: order.state ?? 'sale',
    paymentStatus: order.payment?.reconciliation ?? null,
    currencyCode: order.currency ?? 'EUR',
    totalAmount: order.totals?.gross_cents ?? (order.totals?.gross != null ? Math.round(order.totals.gross * 100) : null),
    createdAt,
    odooPortalUrl: null,
    source: 'odoo_historical',
    sourceLabel: 'Odoo',
    returnRequest: null,
    shipment: null,
    returnWindow: OPEN_RETURN_WINDOW,
  }
}

function mapOdooOrder(r: OdooSaleDocumentDTO): OrderDTO {
  const createdAt = r.dateOrder ?? new Date(0).toISOString()
  return {
    id: `odoo-${r.id}`,
    pwaOrderId: null,
    odooSaleOrderId: r.id,
    orderNumber: formatDisplayOrderNumber({
      id: `odoo-${r.id}`,
      odooSaleOrderId: r.id,
      odooSaleOrderName: r.name,
      createdAt,
    }),
    status: r.state,
    paymentStatus: r.invoiceStatus,
    currencyCode: r.currencyCode,
    totalAmount: r.amountTotalCents,
    createdAt,
    odooPortalUrl: null,
    source: r.source,
    sourceLabel: r.sourceLabel,
    returnRequest: null,
    shipment: null,
    returnWindow: OPEN_RETURN_WINDOW,
  }
}

async function listOdooOrdersForUser(
  userId: string,
  ctx: OdooCallContext,
): Promise<OrderDTO[]> {
  if (!isOdooLiveConfigured()) return []

  const map = await prisma.odooCustomerMap.findUnique({ where: { userId } })

  if (isOdooApiV2Configured()) {
    if (!map) return []
    try {
      const items = await odooApiListOrders(map.odooPartnerId, 1, ctx.correlationId)
      return items.map(mapApiOrder)
    } catch (e) {
      logger.warn('orders.odoo_history_failed', { userId, err: String(e) })
      return []
    }
  }

  if (!isOdooConfigured()) return []

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  if (!user) return []

  try {
    const merged = new Map<number, OdooSaleDocumentDTO>()
    const queries: Array<{ partnerId?: number; email?: string }> = []
    if (map != null) queries.push({ partnerId: map.odooPartnerId })
    queries.push({ email: user.email })

    for (const query of queries) {
      const page = await odooSalesService.listConfirmedOrders(ctx, {
        page: 1,
        pageSize: 50,
        includePwaDrafts: true,
        ...query,
      })
      for (const item of page.items) merged.set(item.id, item)
    }

    return [...merged.values()].map(mapOdooOrder)
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

function parseOdooOrderId(id: string): number | null {
  const match = /^odoo-(\d+)$/.exec(id)
  if (!match) return null
  const n = Number(match[1])
  return Number.isInteger(n) && n > 0 ? n : null
}

function mapApiOrderLines(order: OdooApiOrder): OrderLineDTO[] {
  return (order.lines ?? [])
    .filter((line) => !line.is_delivery)
    .map((line) => ({
      productRef: line.product_id != null ? String(line.product_id) : '',
      variantRef: line.product_id != null ? String(line.product_id) : null,
      quantity: line.qty ?? 0,
      productSlug: null,
      productName: line.name ?? null,
      imageUrl: null,
      unitPriceCents: line.price_unit_net != null ? Math.round(line.price_unit_net * 100) : null,
      lineTotalCents: line.subtotal_net != null ? Math.round(line.subtotal_net * 100) : null,
    }))
}

async function resolveOrderLines(order: OrderDTO, correlationId: string): Promise<OrderLineDTO[]> {
  if (order.pwaOrderId) {
    const local = await loadPwaOrderLines(order.pwaOrderId)
    if (local.length > 0) return local
  }
  if (order.odooSaleOrderId && isOdooApiV2Configured()) {
    try {
      const apiOrder = await odooApiGetOrder(order.odooSaleOrderId, correlationId)
      return mapApiOrderLines(apiOrder)
    } catch (e) {
      logger.warn('orders.api_v2_lines_failed', {
        odooSaleOrderId: order.odooSaleOrderId,
        err: String(e),
      })
    }
  }
  if (order.odooSaleOrderId) {
    return loadOdooOrderLines(order.odooSaleOrderId, correlationId)
  }
  return []
}

async function findOwnedPwaOrder(userId: string, id: string) {
  if (isOdooOrderPublicName(id)) {
    const byName = await prisma.pwaOrder.findFirst({
      where: {
        userId,
        odooSaleOrderName: { equals: id.trim(), mode: 'insensitive' },
        orderStatus: { in: ACCOUNT_VISIBLE_PWA_ORDER_STATUSES },
      },
    })
    if (byName) return byName
  }
  const pwaId = id.startsWith('pwa-') ? id.replace(/^pwa-/, '') : id
  return prisma.pwaOrder.findFirst({
    where: {
      id: pwaId,
      userId,
      orderStatus: { in: ACCOUNT_VISIBLE_PWA_ORDER_STATUSES },
    },
  })
}

function normalizePwaOrderId(id: string) {
  return id.startsWith('pwa-') ? id.replace(/^pwa-/, '') : id
}

async function findAccessiblePwaOrder(req: Request, userId: string, id: string) {
  const sessionId = req.sessionRecord?.id
  const access = {
    OR: [{ userId }, ...(sessionId ? [{ sessionId }] : [])],
  }
  if (isOdooOrderPublicName(id)) {
    const byName = await prisma.pwaOrder.findFirst({
      where: {
        odooSaleOrderName: { equals: id.trim(), mode: 'insensitive' },
        ...access,
      },
    })
    if (byName) return byName
  }
  const pwaId = normalizePwaOrderId(id)
  return prisma.pwaOrder.findFirst({
    where: {
      id: pwaId,
      ...access,
    },
  })
}

export const ordersService = {
  async list(userId: string, correlationId = 'orders-list', sessionId?: string | null): Promise<OrderDTO[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    const emailLower = user?.email.toLowerCase().trim()

    if (emailLower) {
      await linkOrdersToUser({ userId, email: emailLower, sessionId })
    }

    const rows = await ordersRepository.listByUser(userId)
    const fromCache = rows.map(mapRow)

    const pwaOrders = await prisma.pwaOrder.findMany({
      where: buildAccountPwaOrderWhere(userId, emailLower),
      orderBy: { paidAt: 'desc' },
      take: 50,
    })

    mergePwaOrdersIntoList(fromCache, pwaOrders)

    const seenOdooIds = new Set(fromCache.map((o) => o.odooSaleOrderId))
    const liveOdoo = await listOdooOrdersForUser(userId, { correlationId })
    for (const order of liveOdoo) {
      if (!seenOdooIds.has(order.odooSaleOrderId)) {
        fromCache.push(order)
        seenOdooIds.add(order.odooSaleOrderId)
      }
    }
    applyPwaOrderPublicIds(fromCache, pwaOrders)

    const sorted = fromCache.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const withReturns = await orderReturnRequestService.attachToOrders(userId, sorted)
    return orderShipmentService.attachCached(withReturns)
  },

  async getById(userId: string, id: string, correlationId = 'orders-detail'): Promise<OrderDetailDTO> {
    const odooSaleOrderId = parseOdooOrderId(id)
    if (odooSaleOrderId != null || id.startsWith('odoo-') || isOdooOrderPublicName(id)) {
      const owned = await this.list(userId, correlationId)
      const needle = id.trim().toLowerCase()
      const order =
        owned.find((o) => o.id.toLowerCase() === needle) ??
        (odooSaleOrderId != null ? owned.find((o) => o.odooSaleOrderId === odooSaleOrderId) : undefined)
      if (order) {
        const lines = await resolveOrderLines(order, correlationId)
        const [withReturn] = await orderReturnRequestService.attachToOrders(userId, [order])
        return orderShipmentService.attachLive(enrichOrderDetail(withReturn ?? order, lines), correlationId)
      }
      const named = isOdooOrderPublicName(id) ? await findOwnedPwaOrder(userId, id) : null
      if (!named) {
        throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
      }
    }

    const row = await ordersRepository.findForUser(userId, id)
    if (row) {
      const base = mapRow(row)
      if (base.pwaOrderId) {
        const linked = await prisma.pwaOrder.findUnique({
          where: { id: base.pwaOrderId },
          select: {
            id: true,
            odooSaleOrderId: true,
            odooSaleOrderName: true,
            createdAt: true,
            orderStatus: true,
            paymentStatus: true,
          },
        })
        if (linked) {
          base.id = accountOrderPublicId(linked)
          base.orderNumber = formatDisplayOrderNumber(linked)
          if (linked.orderStatus === 'PAYMENT_PENDING' || linked.orderStatus === 'PAYMENT_FAILED') {
            base.status = linked.orderStatus.toLowerCase()
            base.paymentStatus = linked.paymentStatus.toLowerCase()
          }
        }
      }
      const lines = await resolveOrderLines(base, correlationId)
      const [withReturn] = await orderReturnRequestService.attachToOrders(userId, [base])
      return orderShipmentService.attachLive(enrichOrderDetail(withReturn ?? base, lines), correlationId)
    }

    const po = await findOwnedPwaOrder(userId, id)
    if (!po) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }
    const mapped = mapPwaOrderRow(po)
    if (!mapped) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }

    const cache = await prisma.orderCache.findUnique({ where: { id: `pwa-${po.id}` } })
    const base: OrderDTO = {
      ...mapped,
      odooPortalUrl: cache ? portalFromSnapshot(cache.snapshotJson) : null,
    }
    const lines = await resolveOrderLines(base, correlationId)
    const [withReturn] = await orderReturnRequestService.attachToOrders(userId, [base])
    return orderShipmentService.attachLive(enrichOrderDetail(withReturn ?? base, lines), correlationId)
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
    let po = await findAccessiblePwaOrder(req, userId, id)
    if (!po) {
      const odooSaleOrderId = parseOdooOrderId(id)
      if (odooSaleOrderId != null) {
        po = await prisma.pwaOrder.findFirst({
          where: {
            odooSaleOrderId,
            OR: [{ userId }, ...(req.sessionRecord?.id ? [{ sessionId: req.sessionRecord.id }] : [])],
          },
        })
      }
    }
    if (!po) {
      if (id.startsWith('odoo-')) return []
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
