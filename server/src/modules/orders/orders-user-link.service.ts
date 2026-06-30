import type { PwaOrder, PwaOrderStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } from './orders.constants.js'

/** Ordini collegabili al login: checkout in corso + ordini account. */
const LINKABLE_PWA_ORDER_STATUSES: PwaOrderStatus[] = [
  'CART_CREATED',
  'DRAFT',
  'CHECKOUT_STARTED',
  'CHECKOUT_LOCKED',
  'PAYMENT_STARTED',
  'PAYMENT_PENDING',
  'PAYMENT_FAILED',
  ...ACCOUNT_VISIBLE_PWA_ORDER_STATUSES,
]

function normalizeEmail(email: string) {
  return email.toLowerCase().trim()
}

export async function ensureOrderCacheForPwaOrder(userId: string, po: PwaOrder) {
  if (!po.odooSaleOrderId) return

  const cacheId = `pwa-${po.id}`
  const existing = await prisma.orderCache.findUnique({ where: { id: cacheId } })
  const snapshotJson = {
    ...((existing?.snapshotJson as Record<string, unknown> | null) ?? {}),
    pwaOrderId: po.id,
  }

  await prisma.orderCache.upsert({
    where: { id: cacheId },
    create: {
      id: cacheId,
      userId,
      odooSaleOrderId: po.odooSaleOrderId,
      status: 'sale',
      paymentStatus: 'paid',
      currencyCode: po.currencyCode,
      totalAmount: po.amountTotal,
      snapshotJson,
      syncedAt: new Date(),
    },
    update: {
      userId,
      odooSaleOrderId: po.odooSaleOrderId,
      status: 'sale',
      paymentStatus: 'paid',
      currencyCode: po.currencyCode,
      totalAmount: po.amountTotal,
      snapshotJson,
      syncedAt: new Date(),
    },
  })
}

/** Collega ordini guest/sessione all'utente autenticato e allinea la cache locale. */
export async function linkOrdersToUser(params: {
  userId: string
  email: string
  sessionId?: string | null
}) {
  const emailLower = normalizeEmail(params.email)
  const sessionFilters = params.sessionId
    ? [{ sessionId: params.sessionId, userId: null as string | null }]
    : []

  await prisma.pwaOrder.updateMany({
    where: {
      orderStatus: { in: LINKABLE_PWA_ORDER_STATUSES },
      OR: [{ email: emailLower, userId: null }, ...sessionFilters],
    },
    data: { userId: params.userId },
  })

  const owned = await prisma.pwaOrder.findMany({
    where: {
      userId: params.userId,
      orderStatus: { in: LINKABLE_PWA_ORDER_STATUSES },
    },
  })

  for (const po of owned) {
    await ensureOrderCacheForPwaOrder(params.userId, po)
  }

  const cacheIds = owned.map((po) => `pwa-${po.id}`)
  if (cacheIds.length > 0) {
    await prisma.orderCache.updateMany({
      where: { id: { in: cacheIds }, userId: null },
      data: { userId: params.userId },
    })
  }
}
