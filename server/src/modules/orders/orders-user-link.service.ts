import type { PwaOrder, PwaOrderStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { healBankTransferFalselyMarkedFailed } from '../payments/bank-transfer-order-heal.js'
import { ACCOUNT_VISIBLE_PWA_ORDER_STATUSES } from './orders.constants.js'
import { orderCacheFieldsForPwaOrder } from './order-cache-from-pwa.js'

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

export async function ensureOrderCacheForPwaOrder(odooPartnerId: number, po: PwaOrder) {
  if (po.paymentMethod === 'BANK_TRANSFER') {
    const healed = await healBankTransferFalselyMarkedFailed(po.id)
    if (healed) {
      const refreshed = await prisma.pwaOrder.findUnique({ where: { id: po.id } })
      if (refreshed) po = refreshed
    }
  }

  const fields = orderCacheFieldsForPwaOrder(po)
  if (!fields || !po.odooSaleOrderId) return

  const cacheId = `pwa-${po.id}`
  const existing = await prisma.orderCache.findUnique({ where: { id: cacheId } })
  const snapshotJson = {
    ...((existing?.snapshotJson as Record<string, unknown> | null) ?? {}),
    pwaOrderId: po.id,
    ...(po.odooSaleOrderName ? { odooSaleOrderName: po.odooSaleOrderName } : {}),
    ...(po.clientOrderRef ? { clientOrderRef: po.clientOrderRef } : {}),
  }

  await prisma.orderCache.upsert({
    where: { id: cacheId },
    create: {
      id: cacheId,
      odooPartnerId,
      odooSaleOrderId: po.odooSaleOrderId,
      status: fields.status,
      paymentStatus: fields.paymentStatus,
      currencyCode: po.currencyCode,
      totalAmount: po.amountTotal,
      snapshotJson,
      syncedAt: new Date(),
    },
    update: {
      odooPartnerId,
      odooSaleOrderId: po.odooSaleOrderId,
      status: fields.status,
      paymentStatus: fields.paymentStatus,
      currencyCode: po.currencyCode,
      totalAmount: po.amountTotal,
      snapshotJson,
      syncedAt: new Date(),
    },
  })
}

/** Collega ordini guest/sessione al partner autenticato e allinea la cache locale. */
export async function linkOrdersToUser(params: {
  odooPartnerId: number
  email: string
  sessionId?: string | null
}) {
  const emailLower = normalizeEmail(params.email)
  const sessionFilters = params.sessionId
    ? [{ sessionId: params.sessionId, odooPartnerId: null as number | null }]
    : []

  await prisma.pwaOrder.updateMany({
    where: {
      orderStatus: { in: LINKABLE_PWA_ORDER_STATUSES },
      OR: [{ email: emailLower, odooPartnerId: null }, ...sessionFilters],
    },
    data: { odooPartnerId: params.odooPartnerId },
  })

  const owned = await prisma.pwaOrder.findMany({
    where: {
      odooPartnerId: params.odooPartnerId,
      orderStatus: { in: LINKABLE_PWA_ORDER_STATUSES },
    },
  })

  for (const po of owned) {
    await ensureOrderCacheForPwaOrder(params.odooPartnerId, po)
  }

  const cacheIds = owned.map((po) => `pwa-${po.id}`)
  if (cacheIds.length > 0) {
    await prisma.orderCache.updateMany({
      where: { id: { in: cacheIds }, odooPartnerId: null },
      data: { odooPartnerId: params.odooPartnerId },
    })
  }
}
