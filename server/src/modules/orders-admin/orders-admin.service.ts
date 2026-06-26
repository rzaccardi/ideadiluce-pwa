import type { Prisma } from '@prisma/client'
import type { Request } from 'express'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import { resolveArflyProductLabels } from '../catalog/arfly-product-labels.js'
import { parseOdooTemplateId } from '../catalog/odooRef.js'
import { ODOO_ORDER_SOURCE_LABEL } from '../odoo/odoo-order-source.js'
import { odooSalesService } from '../odoo/odoo-sales.service.js'
import { odooSyncQueueService } from '../odoo/odoo-sync-queue.service.js'
import type { OdooSaleDocumentDTO, OdooSaleOrderLineDTO } from '../odoo/odoo-sales.types.js'
import type {
  OrderAdminSource,
  OrdersAdminCartLineDTO,
  OrdersAdminDetailDTO,
  OrdersAdminListDTO,
  OrdersAdminListItemDTO,
  OrdersAdminStatsDTO,
  OrdersAdminTimelineEventDTO,
  OrdersAdminUxInsightDTO,
} from './orders-admin.types.js'

const PAID_STATUSES = ['PAID', 'CONFIRMED', 'COMPLETED'] as const

const FUNNEL_LABELS: Record<string, string> = {
  CART_CREATED: 'Carrello creato',
  DRAFT: 'Bozza checkout',
  CHECKOUT_STARTED: 'Checkout avviato',
  CHECKOUT_LOCKED: 'Prezzi congelati',
  PAYMENT_STARTED: 'Pagamento avviato',
  PAYMENT_PENDING: 'Pagamento in attesa',
  PAID: 'Pagato',
  PAID_SYNC_PENDING: 'Pagato — sync Odoo in attesa',
  SYNCED: 'Sincronizzato Odoo',
  PAYMENT_FAILED: 'Pagamento fallito',
  ABANDONED: 'Abbandonato',
  CANCELLED: 'Annullato',
  CONFIRMED: 'Confermato',
  COMPLETED: 'Completato',
}

const FUNNEL_ORDER = [
  'CART_CREATED',
  'DRAFT',
  'CHECKOUT_STARTED',
  'CHECKOUT_LOCKED',
  'PAYMENT_STARTED',
  'PAYMENT_PENDING',
  'PAID',
  'PAID_SYNC_PENDING',
  'SYNCED',
  'CONFIRMED',
  'COMPLETED',
  'PAYMENT_FAILED',
  'ABANDONED',
  'CANCELLED',
]

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

function minutesBetween(a: Date | null | undefined, b: Date | null | undefined): number | null {
  if (!a || !b) return null
  const ms = b.getTime() - a.getTime()
  if (ms < 0) return null
  return Math.round(ms / 60000)
}

type LineProductInfo = {
  slug: string | null
  name: string | null
  odooTemplateId: number | null
}

const EMPTY_LINE_PRODUCT_INFO: LineProductInfo = {
  slug: null,
  name: null,
  odooTemplateId: null,
}

async function resolveLineProductInfo(refs: string[]): Promise<Map<string, LineProductInfo>> {
  const unique = [...new Set(refs.filter(Boolean))]
  const map = new Map<string, LineProductInfo>()
  if (unique.length === 0) return map

  const labels = await resolveArflyProductLabels(unique)
  for (const ref of unique) {
    const label = labels.get(ref)
    if (!label) continue
    map.set(ref, {
      slug: label.slug,
      name: label.name,
      odooTemplateId: parseOdooTemplateId(ref),
    })
  }

  return map
}

function resolveLineOdooProductId(productRef: string): number | null {
  const trimmed = productRef.trim()
  const odooPrefix = /^odoo:(\d+)$/i.exec(trimmed)
  if (odooPrefix) {
    const id = Number(odooPrefix[1])
    return Number.isInteger(id) && id > 0 ? id : null
  }
  return parseOdooTemplateId(productRef)
}

function mapCartLines(
  items: Array<{
    productRef: string
    variantRef: string | null
    quantity: number
    clientUnitPriceEstimate: number | null
  }>,
  productInfo: Map<string, LineProductInfo>,
): OrdersAdminCartLineDTO[] {
  return items.map((line) => {
    const info = productInfo.get(line.productRef) ?? EMPTY_LINE_PRODUCT_INFO
    const odooTemplateId =
      info.odooTemplateId ?? parseOdooTemplateId(line.productRef)
    return {
      productRef: line.productRef,
      productSlug: info.slug,
      productName: info.name,
      variantRef: line.variantRef,
      quantity: line.quantity,
      unitEstimateCents: line.clientUnitPriceEstimate,
      odooProductId: resolveLineOdooProductId(line.productRef),
      odooTemplateId,
    }
  })
}

function buildTimeline(order: {
  createdAt: Date
  checkoutStartedAt: Date | null
  paymentStartedAt: Date | null
  paidAt: Date | null
  abandonedAt: Date | null
  cancelledAt: Date | null
  confirmedAt: Date | null
  completedAt: Date | null
  lastPaymentError: string | null
  cart: { createdAt: Date; abandonedAt: Date | null; reservationExpiresAt: Date | null }
  payments: Array<{ createdAt: Date; capturedAt: Date | null; failedAt: Date | null; status: string; method: string }>
  checkoutSession: {
    attempts: Array<{ createdAt: Date; status: string; attemptNo: number; failureReason: string | null }>
  } | null
}): OrdersAdminTimelineEventDTO[] {
  const events: OrdersAdminTimelineEventDTO[] = [
    { at: order.cart.createdAt.toISOString(), kind: 'cart', label: 'Carrello creato' },
    { at: order.createdAt.toISOString(), kind: 'order', label: 'Ordine PWA registrato' },
  ]
  if (order.checkoutStartedAt) {
    events.push({
      at: order.checkoutStartedAt.toISOString(),
      kind: 'checkout',
      label: 'Checkout avviato',
    })
  }
  if (order.paymentStartedAt) {
    events.push({
      at: order.paymentStartedAt.toISOString(),
      kind: 'payment',
      label: 'Pagamento avviato',
    })
  }
  for (const a of order.checkoutSession?.attempts ?? []) {
    events.push({
      at: a.createdAt.toISOString(),
      kind: 'attempt',
      label: `Tentativo checkout #${a.attemptNo}`,
      detail: a.failureReason ?? a.status,
    })
  }
  for (const p of order.payments) {
    events.push({
      at: p.createdAt.toISOString(),
      kind: 'payment',
      label: `Pagamento ${p.method} (${p.status})`,
    })
    if (p.capturedAt) {
      events.push({
        at: p.capturedAt.toISOString(),
        kind: 'payment',
        label: 'Pagamento catturato',
      })
    }
    if (p.failedAt) {
      events.push({
        at: p.failedAt.toISOString(),
        kind: 'payment_failed',
        label: 'Pagamento fallito',
      })
    }
  }
  if (order.paidAt) {
    events.push({ at: order.paidAt.toISOString(), kind: 'paid', label: 'Ordine pagato' })
  }
  if (order.abandonedAt) {
    events.push({ at: order.abandonedAt.toISOString(), kind: 'abandoned', label: 'Ordine abbandonato' })
  }
  if (order.cart.abandonedAt) {
    events.push({
      at: order.cart.abandonedAt.toISOString(),
      kind: 'cart_abandoned',
      label: 'Carrello marcato abbandonato',
    })
  }
  if (order.lastPaymentError) {
    events.push({
      at: (order.paidAt ?? order.paymentStartedAt ?? order.createdAt).toISOString(),
      kind: 'error',
      label: 'Errore pagamento',
      detail: order.lastPaymentError,
    })
  }
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}


function mapPwaListItem(o: {
  id: string
  email: string
  orderStatus: string
  paymentStatus: string
  paymentMethod: string | null
  currencyCode: string
  amountTotal: number | null
  odooSaleOrderId: number | null
  odooLastSyncStatus: string
  userId: string | null
  createdAt: Date
  paidAt: Date | null
  checkoutStartedAt: Date | null
  cart: { _count: { items: number } }
}): OrdersAdminListItemDTO {
  return {
    id: o.id,
    email: o.email,
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    currencyCode: o.currencyCode,
    amountTotal: o.amountTotal,
    lineItemCount: o.cart._count.items,
    odooSaleOrderId: o.odooSaleOrderId,
    userId: o.userId,
    isGuest: !o.userId,
    createdAt: o.createdAt.toISOString(),
    paidAt: o.paidAt?.toISOString() ?? null,
    checkoutStartedAt: o.checkoutStartedAt?.toISOString() ?? null,
    minutesToPay: minutesBetween(o.checkoutStartedAt, o.paidAt),
    source: 'pwa',
    sourceLabel: 'E-commerce',
    odooOrderName: null,
    partnerName: null,
    isOdooOnly: false,
    odooLastSyncStatus: o.odooLastSyncStatus,
  }
}


function buildCustomerSearchWhere(q: string): Prisma.PwaOrderWhereInput {
  const term = q.trim()
  return {
    OR: [
      { email: { contains: term, mode: 'insensitive' } },
      {
        user: {
          is: {
            OR: [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      },
    ],
  }
}

function adminOdooCtx(req?: Request): OdooCallContext {
  return { correlationId: req?.correlationId ?? 'admin-orders', req }
}

function mapOdooInvoiceStatus(invoiceStatus: string | null | undefined): string {
  switch (invoiceStatus) {
    case 'invoiced':
      return 'CAPTURED'
    case 'to invoice':
      return 'AUTHORIZED'
    case 'no':
      return 'NOT_STARTED'
    default:
      return 'CAPTURED'
  }
}

function mapOdooOrderStatus(state: string | null | undefined): string {
  if (state === 'done') return 'COMPLETED'
  if (state === 'sale') return 'CONFIRMED'
  return 'CONFIRMED'
}

function mapOdooListItem(row: OdooSaleDocumentDTO): OrdersAdminListItemDTO {
  const date = row.dateOrder ?? new Date(0).toISOString()
  return {
    id: `odoo-${row.id}`,
    email: row.partnerEmail ?? '',
    orderStatus: mapOdooOrderStatus(row.state),
    paymentStatus: mapOdooInvoiceStatus(row.invoiceStatus),
    paymentMethod: null,
    currencyCode: row.currencyCode ?? 'EUR',
    amountTotal: row.amountTotalCents,
    lineItemCount: row.lineCount,
    odooSaleOrderId: row.id,
    userId: null,
    isGuest: true,
    createdAt: date,
    paidAt: date,
    checkoutStartedAt: null,
    minutesToPay: null,
    source: row.source,
    sourceLabel: row.sourceLabel || ODOO_ORDER_SOURCE_LABEL[row.source],
    odooOrderName: row.name,
    partnerName: row.partnerName,
    isOdooOnly: row.source !== 'pwa',
    odooLastSyncStatus: null,
  }
}

function buildOdooListQuery(query: {
  page: number
  pageSize: number
  q?: string
  days?: number
}) {
  const q = query.q?.trim()
  return {
    page: query.page,
    pageSize: query.pageSize,
    q: q && !q.includes('@') ? q : undefined,
    email: q?.includes('@') ? q : undefined,
    days: query.days && query.days > 0 ? query.days : undefined,
  }
}

function isPwaFunnelOnly(query: {
  phase?: 'cart' | 'checkout' | 'paid' | 'problem'
  status?: string
  paymentStatus?: string
}): boolean {
  if (query.phase && query.phase !== 'paid') return true
  if (query.status) return true
  if (query.paymentStatus) return true
  return false
}

function isOdooSourceFilter(source: OrderAdminSource | 'all' | undefined): source is OrderAdminSource {
  return source != null && source !== 'all' && source !== 'pwa'
}

function sortAdminListItems(
  items: OrdersAdminListItemDTO[],
  sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc',
): OrdersAdminListItemDTO[] {
  const copy = [...items]
  copy.sort((a, b) => {
    if (sort === 'date_asc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (sort === 'amount_desc') {
      return (b.amountTotal ?? 0) - (a.amountTotal ?? 0)
    }
    if (sort === 'amount_asc') {
      return (a.amountTotal ?? 0) - (b.amountTotal ?? 0)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return copy
}

function dedupeOdooFromPwa(
  pwaItems: OrdersAdminListItemDTO[],
  odooItems: OrdersAdminListItemDTO[],
): OrdersAdminListItemDTO[] {
  const pwaOdooIds = new Set(
    pwaItems.map((i) => i.odooSaleOrderId).filter((id): id is number => id != null),
  )
  return odooItems.filter(
    (o) =>
      o.odooSaleOrderId != null &&
      !pwaOdooIds.has(o.odooSaleOrderId) &&
      o.source !== 'pwa',
  )
}

async function fetchOdooListItems(
  query: {
    page: number
    pageSize: number
    q?: string
    days?: number
    source?: OrderAdminSource | 'all'
  },
  ctx: OdooCallContext,
): Promise<{ items: OrdersAdminListItemDTO[]; total: number }> {
  if (!isOdooConfigured()) return { items: [], total: 0 }

  try {
    const result = await odooSalesService.listConfirmedOrders(ctx, buildOdooListQuery(query))
    let items = result.items.map(mapOdooListItem)
    if (isOdooSourceFilter(query.source)) {
      const source = query.source
      items = items.filter((i: OrdersAdminListItemDTO) => i.source === source)
    }
    return { items, total: Number(result.total) || 0 }
  } catch (e) {
    logger.warn('orders_admin.odoo_list_failed', { err: String(e) }, ctx.req)
    return { items: [], total: 0 }
  }
}

function buildPwaListWhere(query: {
  q?: string
  status?: string
  phase?: 'cart' | 'checkout' | 'paid' | 'problem'
  paymentStatus?: string
  days?: number
}): Prisma.PwaOrderWhereInput {
  const PHASE_STATUSES = {
    cart: ['CART_CREATED'],
    checkout: ['CHECKOUT_STARTED', 'PAYMENT_STARTED', 'PAYMENT_PENDING'],
    paid: ['PAID', 'CONFIRMED', 'COMPLETED'],
    problem: ['PAYMENT_FAILED', 'ABANDONED', 'CANCELLED'],
  } as const

  const where: Prisma.PwaOrderWhereInput = {}
  if (query.days && query.days > 0) {
    where.createdAt = { gte: new Date(Date.now() - query.days * 86400000) }
  }
  if (query.phase) {
    where.orderStatus = { in: [...PHASE_STATUSES[query.phase]] }
  } else if (query.status) {
    where.orderStatus = query.status as never
  }
  if (query.paymentStatus) where.paymentStatus = query.paymentStatus as never
  if (query.q?.trim()) {
    Object.assign(where, buildCustomerSearchWhere(query.q))
  }
  return where
}





function buildUxInsights(input: {
  lineCount: number
  paidAt: Date | null
  checkoutStartedAt: Date | null
  createdAt: Date
  cartCreatedAt: Date
  paymentAttemptCount: number
  failedPayments: number
  relatedPaidCount: number
  amountTotal: number | null
  isGuest: boolean
  orderStatus: string
}): OrdersAdminUxInsightDTO[] {
  const insights: OrdersAdminUxInsightDTO[] = []

  if (input.lineCount === 1 && input.paidAt) {
    insights.push({
      code: 'single_item',
      severity: 'warning',
      title: 'Ordine mono-riga',
      description:
        'Opportunità cross-sell: il cliente ha acquistato un solo SKU. Valuta bundle o prodotti correlati nel follow-up.',
    })
  }

  if (input.lineCount >= 3) {
    insights.push({
      code: 'multi_item',
      severity: 'success',
      title: 'Carrello composito',
      description: `${input.lineCount} righe: comportamento da cliente consapevole del catalogo.`,
    })
  }

  const toCheckout = minutesBetween(input.cartCreatedAt, input.checkoutStartedAt)
  if (toCheckout != null && toCheckout > 60 && !input.paidAt) {
    insights.push({
      code: 'slow_checkout',
      severity: 'warning',
      title: 'Checkout lento',
      description: `Oltre ${toCheckout} minuti tra carrello e avvio checkout senza conversione — possibile frizione UX o confronto prezzi.`,
    })
  }

  if (input.failedPayments > 0) {
    insights.push({
      code: 'payment_retries',
      severity: 'warning',
      title: 'Tentativi pagamento falliti',
      description: `${input.failedPayments} pagamento/i fallito/i: verifica metodo, 3DS o messaggi errore in checkout.`,
    })
  }

  if (input.relatedPaidCount > 0) {
    insights.push({
      code: 'repeat_buyer',
      severity: 'success',
      title: 'Cliente ricorrente',
      description: `${input.relatedPaidCount} altro/i ordine/i pagato/i con la stessa email — priorità retention e upsell.`,
    })
  }

  if (input.isGuest && input.paidAt) {
    insights.push({
      code: 'guest_paid',
      severity: 'info',
      title: 'Checkout ospite convertito',
      description: 'Invito account post-acquisto può aumentare riordini e tracking wishlist.',
    })
  }

  if (input.orderStatus === 'ABANDONED' || input.orderStatus === 'PAYMENT_FAILED') {
    insights.push({
      code: 'recovery',
      severity: 'warning',
      title: 'Recupero carrello',
      description: 'Valuta email di recupero o remarketing sulle righe abbandonate.',
    })
  }

  return insights
}

export const ordersAdminService = {
  async getStats(days: number): Promise<OrdersAdminStatsDTO> {
    const since = new Date(Date.now() - days * 86400000)

    const orders = await prisma.pwaOrder.findMany({
      where: { createdAt: { gte: since } },
      select: {
        orderStatus: true,
        paymentStatus: true,
        paymentMethod: true,
        amountTotal: true,
        userId: true,
        email: true,
        odooSaleOrderId: true,
        createdAt: true,
        checkoutStartedAt: true,
        paidAt: true,
        cart: { select: { createdAt: true, items: { select: { id: true } } } },
      },
    })

    const statusMap = new Map<string, number>()
    for (const o of orders) {
      statusMap.set(o.orderStatus, (statusMap.get(o.orderStatus) ?? 0) + 1)
    }

    const funnel = FUNNEL_ORDER.filter((s) => statusMap.has(s)).map((status) => ({
      status,
      count: statusMap.get(status) ?? 0,
      label: FUNNEL_LABELS[status] ?? status,
    }))

    const paid = orders.filter((o) => PAID_STATUSES.includes(o.orderStatus as (typeof PAID_STATUSES)[number]))
    const revenueCents = paid.reduce((s, o) => s + (o.amountTotal ?? 0), 0)
    const paidCount = paid.length
    const checkoutStarted = orders.filter((o) => o.checkoutStartedAt != null).length
    const abandonedCount = orders.filter((o) => o.orderStatus === 'ABANDONED').length

    const lineCounts = paid.map((o) => o.cart.items.length)
    const avgLineItems =
      lineCounts.length > 0 ? lineCounts.reduce((a, b) => a + b, 0) / lineCounts.length : 0

    const toCheckoutMins = orders
      .map((o) => minutesBetween(o.cart.createdAt, o.checkoutStartedAt))
      .filter((v): v is number => v != null)
    const toPayMins = paid
      .map((o) => minutesBetween(o.checkoutStartedAt, o.paidAt))
      .filter((v): v is number => v != null)
    const cartToPaidMins = paid
      .map((o) => minutesBetween(o.cart.createdAt, o.paidAt))
      .filter((v): v is number => v != null)

    const paidEmails = new Set(paid.map((o) => o.email.toLowerCase()))
    const emailOrderCount = new Map<string, number>()
    for (const o of paid) {
      const e = o.email.toLowerCase()
      emailOrderCount.set(e, (emailOrderCount.get(e) ?? 0) + 1)
    }
    const repeatEmails = [...emailOrderCount.values()].filter((c) => c > 1).length
    const repeatCustomerPct =
      paidEmails.size > 0 ? Math.round((repeatEmails / paidEmails.size) * 100) : 0

    const guestPaid = paid.filter((o) => !o.userId).length
    const guestCheckoutPct = paidCount > 0 ? Math.round((guestPaid / paidCount) * 100) : 0

    const singleItem = paid.filter((o) => o.cart.items.length === 1).length
    const singleItemOrderPct = paidCount > 0 ? Math.round((singleItem / paidCount) * 100) : 0

    const odooMapped = paid.filter((o) => o.odooSaleOrderId != null).length
    const odooMappedPct = paidCount > 0 ? Math.round((odooMapped / paidCount) * 100) : 0

    const methodMap = new Map<string, { count: number; revenueCents: number }>()
    for (const o of paid) {
      const m = o.paymentMethod ?? 'UNKNOWN'
      const cur = methodMap.get(m) ?? { count: 0, revenueCents: 0 }
      cur.count += 1
      cur.revenueCents += o.amountTotal ?? 0
      methodMap.set(m, cur)
    }

    const failedPaymentAttempts = await prisma.checkoutAttempt.count({
      where: {
        status: 'FAILED',
        checkoutSession: { createdAt: { gte: since } },
      },
    })

    const paymentMethods = [...methodMap.entries()].map(([method, v]) => ({
      method,
      count: v.count,
      revenueCents: v.revenueCents,
    }))

    return {
      periodDays: days,
      since: since.toISOString(),
      paidCount,
      revenueCents,
      averageOrderValueCents: paidCount > 0 ? Math.round(revenueCents / paidCount) : 0,
      avgLineItems: Math.round(avgLineItems * 10) / 10,
      abandonedCount,
      checkoutStartedCount: checkoutStarted,
      checkoutConversionPct:
        checkoutStarted > 0 ? Math.round((paidCount / checkoutStarted) * 100) : 0,
      repeatCustomerPct,
      guestCheckoutPct,
      medianMinutesToCheckout: median(toCheckoutMins),
      medianMinutesToPay: median(toPayMins),
      medianMinutesCartToPaid: median(cartToPaidMins),
      failedPaymentAttempts,
      funnel,
      paymentMethods,
      singleItemOrderPct,
      odooMappedPct,
    }
  },

  async listOrders(
    query: {
      page: number
      pageSize: number
      q?: string
      status?: string
      phase?: 'cart' | 'checkout' | 'paid' | 'problem'
      paymentStatus?: string
      days?: number
      sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
      source?: OrderAdminSource | 'all'
    },
    req?: Request,
  ): Promise<OrdersAdminListDTO> {
    const source = query.source ?? 'all'
    const ctx = adminOdooCtx(req)

    if (source === 'pwa' || isPwaFunnelOnly(query)) {
      return this.listPwaOrders(query)
    }

    if (isOdooSourceFilter(source)) {
      return this.listOdooOrders(query, ctx, source)
    }

    return this.listMergedOrders(query, ctx)
  },

  async listPwaOrders(query: {
    page: number
    pageSize: number
    q?: string
    status?: string
    phase?: 'cart' | 'checkout' | 'paid' | 'problem'
    paymentStatus?: string
    days?: number
    sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  }): Promise<OrdersAdminListDTO> {
    const where = buildPwaListWhere(query)

    const orderBy: Prisma.PwaOrderOrderByWithRelationInput =
      query.sort === 'date_asc'
        ? { createdAt: 'asc' }
        : query.sort === 'amount_desc'
          ? { amountTotal: 'desc' }
          : query.sort === 'amount_asc'
            ? { amountTotal: 'asc' }
            : { createdAt: 'desc' }

    const [total, rows] = await Promise.all([
      prisma.pwaOrder.count({ where }),
      prisma.pwaOrder.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { cart: { include: { _count: { select: { items: true } } } } },
      }),
    ])

    return {
      items: rows.map(mapPwaListItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async listOdooOrders(
    query: {
      page: number
      pageSize: number
      q?: string
      days?: number
      sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
      source?: OrderAdminSource | 'all'
    },
    ctx: OdooCallContext,
    sourceFilter?: OrderAdminSource,
  ): Promise<OrdersAdminListDTO> {
    const skip = (query.page - 1) * query.pageSize
    const need = skip + query.pageSize
    const batchSize = Math.max(query.pageSize, 50)
    let odooPage = 1
    let odooTotal = 0
    const collected: OrdersAdminListItemDTO[] = []

    while (collected.length < need && odooPage <= 30) {
      const batch = await fetchOdooListItems(
        { ...query, page: odooPage, pageSize: batchSize, source: sourceFilter ?? query.source },
        ctx,
      )
      odooTotal = batch.total
      collected.push(...batch.items)
      if (odooPage * batchSize >= batch.total) break
      odooPage += 1
    }

    const sorted = sortAdminListItems(collected, query.sort)
    const pageItems = sorted.slice(skip, skip + query.pageSize)
    const total = sourceFilter ? sorted.length : odooTotal

    return {
      items: pageItems,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async listMergedOrders(
    query: {
      page: number
      pageSize: number
      q?: string
      days?: number
      sort?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
      phase?: 'cart' | 'checkout' | 'paid' | 'problem'
      status?: string
      paymentStatus?: string
    },
    ctx: OdooCallContext,
  ): Promise<OrdersAdminListDTO> {
    const fetchLimit = query.page * query.pageSize
    const pwaQuery = { ...query, page: 1, pageSize: fetchLimit }

    const [pwaResult, odooResult, linkedOdooCount] = await Promise.all([
      this.listPwaOrders(pwaQuery),
      fetchOdooListItems({ ...query, page: 1, pageSize: fetchLimit }, ctx),
      prisma.pwaOrder.count({
        where: {
          ...buildPwaListWhere(query),
          odooSaleOrderId: { not: null },
        },
      }),
    ])

    const odooItems = dedupeOdooFromPwa(pwaResult.items, odooResult.items)
    const merged = sortAdminListItems([...pwaResult.items, ...odooItems], query.sort)
    const skip = (query.page - 1) * query.pageSize
    const pageItems = merged.slice(skip, skip + query.pageSize)
    const overlap = Math.min(linkedOdooCount, odooResult.total)
    const total = Math.max(0, pwaResult.total + odooResult.total - overlap)

    return {
      items: pageItems,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    }
  },

  async getOdooOrder(odooSaleOrderId: number, req?: Request): Promise<OrdersAdminDetailDTO> {
    if (!isOdooConfigured()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Odoo non configurato: impossibile caricare l’ordine.',
        503,
        false,
      )
    }

    const ctx = adminOdooCtx(req)
    let row: OdooSaleDocumentDTO | null
    let lines: OdooSaleOrderLineDTO[]
    try {
      ;[row, lines] = await Promise.all([
        odooSalesService.getOrderById(ctx, odooSaleOrderId),
        odooSalesService.getOrderLines(ctx, odooSaleOrderId),
      ])
    } catch (e) {
      logger.warn('orders_admin.odoo_detail_failed', { odooSaleOrderId, err: String(e) }, req)
      throw new AppError(
        'ODOO_ORDER_FETCH_FAILED',
        'Failed to load Odoo order',
        'Impossibile caricare l’ordine da Odoo.',
        502,
        true,
      )
    }

    if (!row) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }

    const date = row.dateOrder ?? new Date(0).toISOString()
    const mappedLines: OrdersAdminCartLineDTO[] = lines.map((line: OdooSaleOrderLineDTO) => ({
      productRef: line.productId != null ? `odoo:${line.productId}` : `odoo-line-${line.id}`,
      productSlug: null,
      productName: line.productName,
      variantRef: null,
      quantity: line.quantity,
      unitEstimateCents: line.unitPriceCents,
      odooProductId: line.productId,
      odooTemplateId: null,
    }))

    return {
      id: `odoo-${row.id}`,
      email: row.partnerEmail ?? '',
      orderStatus: mapOdooOrderStatus(row.state),
      paymentStatus: mapOdooInvoiceStatus(row.invoiceStatus),
      paymentMethod: null,
      currencyCode: row.currencyCode ?? 'EUR',
      amountTotal: row.amountTotalCents,
      userId: null,
      sessionId: null,
      isGuest: true,
      cartId: null,
      checkoutSessionId: null,
      odooPartnerId: row.partnerId,
      odooSaleOrderId: row.id,
      odooLastSyncStatus: null,
      providerTransactionId: null,
      lastPaymentError: null,
      createdAt: date,
      checkoutStartedAt: null,
      paymentStartedAt: null,
      paidAt: date,
      abandonedAt: null,
      source: row.source,
      sourceLabel: row.sourceLabel || ODOO_ORDER_SOURCE_LABEL[row.source],
      odooOrderName: row.name,
      partnerName: row.partnerName,
      clientOrderRef: row.clientOrderRef,
      isOdooOnly: row.source !== 'pwa',
      cart: null,
      lines: mappedLines,
      checkoutAttempts: [],
      payments: [],
      timeline: [
        { at: date, kind: 'odoo', label: 'Ordine Odoo', detail: row.name },
        ...(row.commitmentDate
          ? [{ at: row.commitmentDate, kind: 'odoo', label: 'Data consegna prevista' }]
          : []),
      ],
      relatedOrders: [],
      uxInsights: [],
      odooSyncQueue: null,
    }
  },

  async getOrder(id: string, req?: Request): Promise<OrdersAdminDetailDTO> {
    const odooMatch = /^odoo-(\d+)$/.exec(id)
    if (odooMatch) {
      return this.getOdooOrder(Number(odooMatch[1]), req)
    }

    const order = await prisma.pwaOrder.findUnique({
      where: { id },
      include: {
        cart: {
          include: {
            items: true,
            shippingSelection: true,
          },
        },
        payments: { orderBy: { createdAt: 'asc' } },
        checkoutSession: {
          include: { attempts: { orderBy: { attemptNo: 'asc' } } },
        },
      },
    })

    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }

    const hubInfo = await resolveLineProductInfo(order.cart.items.map((i) => i.productRef))

    const related = await prisma.pwaOrder.findMany({
      where: {
        email: order.email,
        id: { not: order.id },
        orderStatus: { in: [...PAID_STATUSES, 'CHECKOUT_STARTED', 'PAYMENT_STARTED', 'ABANDONED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { cart: { include: { _count: { select: { items: true } } } } },
    })

    const relatedPaidCount = related.filter((r) =>
      PAID_STATUSES.includes(r.orderStatus as (typeof PAID_STATUSES)[number]),
    ).length

    const failedPayments = order.payments.filter((p) => p.status === 'FAILED').length

    const timeline = buildTimeline({
      ...order,
      cancelledAt: order.cancelledAt,
      confirmedAt: order.confirmedAt,
      completedAt: order.completedAt,
      checkoutSession: order.checkoutSession,
    })

    const uxInsights = buildUxInsights({
      lineCount: order.cart.items.length,
      paidAt: order.paidAt,
      checkoutStartedAt: order.checkoutStartedAt,
      createdAt: order.createdAt,
      cartCreatedAt: order.cart.createdAt,
      paymentAttemptCount: order.checkoutSession?.attempts.length ?? 0,
      failedPayments,
      relatedPaidCount,
      amountTotal: order.amountTotal,
      isGuest: !order.userId,
      orderStatus: order.orderStatus,
    })

    const odooSyncQueue = await odooSyncQueueService.findActiveForOrder(order.id)

    return {
      id: order.id,
      email: order.email,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      currencyCode: order.currencyCode,
      amountTotal: order.amountTotal,
      userId: order.userId,
      sessionId: order.sessionId,
      isGuest: !order.userId,
      cartId: order.cartId,
      checkoutSessionId: order.checkoutSessionId,
      odooPartnerId: order.odooPartnerId,
      odooSaleOrderId: order.odooSaleOrderId,
      odooLastSyncStatus: order.odooLastSyncStatus,
      providerTransactionId: order.providerTransactionId,
      lastPaymentError: order.lastPaymentError,
      createdAt: order.createdAt.toISOString(),
      checkoutStartedAt: order.checkoutStartedAt?.toISOString() ?? null,
      paymentStartedAt: order.paymentStartedAt?.toISOString() ?? null,
      paidAt: order.paidAt?.toISOString() ?? null,
      abandonedAt: order.abandonedAt?.toISOString() ?? null,
      source: 'pwa',
      sourceLabel: 'E-commerce',
      odooOrderName: null,
      partnerName: null,
      clientOrderRef: order.clientOrderRef,
      isOdooOnly: false,
      cart: {
        status: order.cart.status,
        estimatedTotal: order.cart.estimatedTotal,
        reservationExpiresAt: order.cart.reservationExpiresAt?.toISOString() ?? null,
        abandonedAt: order.cart.abandonedAt?.toISOString() ?? null,
        createdAt: order.cart.createdAt.toISOString(),
      },
      lines: mapCartLines(order.cart.items, hubInfo),
      checkoutAttempts: (order.checkoutSession?.attempts ?? []).map((a) => ({
        attemptNo: a.attemptNo,
        status: a.status,
        provider: a.provider,
        failureReason: a.failureReason,
        createdAt: a.createdAt.toISOString(),
      })),
      payments: order.payments.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: p.amount,
        createdAt: p.createdAt.toISOString(),
        capturedAt: p.capturedAt?.toISOString() ?? null,
        failedAt: p.failedAt?.toISOString() ?? null,
        failureReason: p.failureReason,
      })),
      timeline,
      relatedOrders: related.map((r) => ({
        id: r.id,
        orderStatus: r.orderStatus,
        amountTotal: r.amountTotal,
        paidAt: r.paidAt?.toISOString() ?? null,
        lineItemCount: r.cart._count.items,
      })),
      uxInsights,
      odooSyncQueue,
    }
  },

  async retryOrderSync(orderId: string, req: Request) {
    const order = await prisma.pwaOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
    }
    const active = await odooSyncQueueService.findActiveForOrder(orderId)
    if (active) {
      return odooSyncQueueService.retryById(active.id, req)
    }
    if (!isOdooConfigured()) {
      throw new AppError(
        'ODOO_NOT_CONFIGURED',
        'Odoo not configured',
        'Odoo non configurato.',
        503,
        false,
      )
    }
    const queued = await odooSyncQueueService.enqueueFailure({
      pwaOrderId: orderId,
      operation: 'funnel_sync',
      lastError: 'Retry manuale admin',
    })
    if (!queued) {
      throw new AppError('SYNC_NOT_AVAILABLE', 'Sync unavailable', 'Sync non disponibile.', 503, false)
    }
    return odooSyncQueueService.retryById(queued.id, req)
  },
}
