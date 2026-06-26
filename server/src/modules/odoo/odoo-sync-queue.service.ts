import type { OdooSyncQueueStatus, Prisma } from '@prisma/client'
import type { Request } from 'express'
import { syncSaleOrderFunnelState, type OdooFunnelState } from '../../adapters/odoo/odooFunnelSync.js'
import { createOdooOrderAdapter } from '../../adapters/odoo/odooOrderAdapter.js'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type {
  OdooSyncOperationDTO,
  OdooSyncQueueItemDTO,
  OdooSyncQueueListDTO,
} from '../../types/odoo.dto.js'
import {
  orderStatusToDTO,
  paymentMethodToDTO,
  paymentStatusToDTO,
} from '../payments/payment.types.js'
import { sendMail } from '../../lib/mail.js'

const orderAdapter = createOdooOrderAdapter()
const SYNC_ALERT_TO = 'info@ideadiluce.com'

async function notifySyncExhausted(input: {
  queueId: string
  pwaOrderId: string
  operation: string
  attempts: number
  lastError: string
}) {
  try {
    await sendMail({
      to: SYNC_ALERT_TO,
      subject: `[Idea di Luce] Sync Odoo esaurita — ordine ${input.pwaOrderId}`,
      text: [
        'Tipo: Coda sync Odoo — tentativi esauriti',
        `ID coda: ${input.queueId}`,
        `Ordine PWA: ${input.pwaOrderId}`,
        `Operazione: ${input.operation}`,
        `Tentativi: ${input.attempts}`,
        '',
        input.lastError,
      ].join('\n'),
    })
  } catch (e) {
    logger.warn('odoo.sync_queue_exhausted_mail_failed', {
      queueId: input.queueId,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

export const ODOO_SYNC_BACKOFF_MS = [60_000, 300_000, 900_000, 3_600_000] as const
export const ODOO_SYNC_MAX_ATTEMPTS = ODOO_SYNC_BACKOFF_MS.length

export type OdooSyncQueueOperation = 'funnel_sync' | 'reconcile_lines'

type EnqueueInput = {
  pwaOrderId: string
  operation: OdooSyncQueueOperation | 'FUNNEL_SYNC' | 'RECONCILE_LINES'
  payload?: Prisma.InputJsonValue
  lastError?: string
  error?: string
}

function backoffMs(attempts: number): number {
  const idx = Math.min(Math.max(attempts, 0), ODOO_SYNC_BACKOFF_MS.length - 1)
  return ODOO_SYNC_BACKOFF_MS[idx]!
}

function normalizeOperation(operation: string): OdooSyncQueueOperation {
  return operation === 'reconcile_lines' || operation === 'RECONCILE_LINES'
    ? 'reconcile_lines'
    : 'funnel_sync'
}

function toOperationDto(operation: string): OdooSyncOperationDTO {
  return normalizeOperation(operation) === 'reconcile_lines' ? 'RECONCILE_LINES' : 'FUNNEL_SYNC'
}

function mapQueueItem(
  row: Prisma.OdooSyncQueueGetPayload<{ include: { order: { select: { email: true; odooSaleOrderId: true } } } }>,
): OdooSyncQueueItemDTO {
  return {
    id: row.id,
    pwaOrderId: row.pwaOrderId,
    operation: toOperationDto(row.operation),
    status: row.status as OdooSyncQueueItemDTO['status'],
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    nextRetryAt: row.nextRetryAt.toISOString(),
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.resolvedAt?.toISOString() ?? null,
    orderEmail: row.order.email,
    odooSaleOrderId: row.order.odooSaleOrderId,
  }
}

function funnelStateFromPayload(payload: unknown, order: { id: string }): OdooFunnelState {
  const data = payload as {
    funnelState?: Partial<OdooFunnelState>
    orderStatus?: string
    paymentStatus?: string
    paymentMethod?: string | null
  }
  if (data.funnelState) {
    return {
      pwaOrderId: data.funnelState.pwaOrderId ?? order.id,
      orderStatus: data.funnelState.orderStatus ?? 'unknown',
      paymentStatus: data.funnelState.paymentStatus ?? 'unknown',
      paymentMethod: data.funnelState.paymentMethod ?? null,
      cartId: data.funnelState.cartId ?? null,
      sessionId: data.funnelState.sessionId ?? null,
      abandonedAt: data.funnelState.abandonedAt ?? null,
      lastPaymentError: data.funnelState.lastPaymentError ?? null,
      providerTransactionId: data.funnelState.providerTransactionId ?? null,
    }
  }
  return {
    pwaOrderId: order.id,
    orderStatus: data.orderStatus ?? 'unknown',
    paymentStatus: data.paymentStatus ?? 'unknown',
    paymentMethod: data.paymentMethod ?? null,
  }
}

async function executeQueueOperation(
  ctx: OdooCallContext,
  operation: string,
  pwaOrderId: string,
  payload: unknown,
): Promise<void> {
  const order = await prisma.pwaOrder.findUnique({ where: { id: pwaOrderId } })
  if (!order) {
    throw new AppError('ORDER_NOT_FOUND', 'Order not found', 'Ordine non trovato.', 404, false)
  }
  if (!order.odooSaleOrderId) {
    throw new AppError(
      'ODOO_ORDER_MISSING',
      'Missing odooSaleOrderId',
      'Ordine senza sale.order Odoo collegato.',
      409,
      false,
    )
  }

  if (operation === 'RECONCILE_LINES') {
    const data = payload as {
      lines?: Array<{
        productRef: string
        variantRef?: string | null
        quantity: number
        unitPriceCents?: number
      }>
      shippingLine?: {
        label: string
        amountCents: number
        carrierCode?: string
        serviceCode?: string
      } | null
    }
    if (!Array.isArray(data.lines) || data.lines.length === 0) {
      const cart = await prisma.cart.findUnique({
        where: { id: order.cartId },
        include: { items: true, shippingSelection: true },
      })
      if (!cart?.items.length) {
        throw new AppError('EMPTY_CART', 'Cart empty', 'Carrello vuoto.', 400, false)
      }
      await orderAdapter.reconcileSaleOrderLines(
        ctx,
        order.odooSaleOrderId,
        cart.items.map((i) => ({
          productRef: i.productRef,
          variantRef: i.variantRef,
          quantity: i.quantity,
          unitPriceCents: i.clientUnitPriceEstimate ?? undefined,
        })),
        cart.shippingSelection
          ? {
              label: cart.shippingSelection.label,
              amountCents: cart.shippingSelection.amountCents,
              carrierCode: cart.shippingSelection.carrierCode,
              serviceCode: cart.shippingSelection.serviceCode,
            }
          : null,
      )
      return
    }
    await orderAdapter.reconcileSaleOrderLines(
      ctx,
      order.odooSaleOrderId,
      data.lines,
      data.shippingLine ?? null,
    )
    return
  }

  const funnelState = funnelStateFromPayload(payload, order)
  if (!payload || typeof payload !== 'object' || !('funnelState' in (payload as object))) {
    funnelState.cartId = order.cartId
    funnelState.sessionId = order.sessionId
    funnelState.abandonedAt = order.abandonedAt
    funnelState.lastPaymentError = order.lastPaymentError
    funnelState.providerTransactionId = order.providerTransactionId
    if (!funnelState.orderStatus || funnelState.orderStatus === 'unknown') {
      funnelState.orderStatus = orderStatusToDTO(order.orderStatus)
    }
    if (!funnelState.paymentStatus || funnelState.paymentStatus === 'unknown') {
      funnelState.paymentStatus = paymentStatusToDTO(order.paymentStatus)
    }
    if (funnelState.paymentMethod == null && order.paymentMethod) {
      funnelState.paymentMethod = paymentMethodToDTO(order.paymentMethod)
    }
  }

  const syncStatus = await syncSaleOrderFunnelState(ctx, order.odooSaleOrderId, funnelState)
  if (syncStatus === 'failed') {
    throw new Error('Sync funnel Odoo fallita')
  }
  if (syncStatus === 'skipped') {
    throw new AppError('ODOO_DISABLED', 'Odoo sync skipped', 'Odoo non abilitato.', 503, false)
  }
}

export async function enqueueOdooSyncFailure(input: EnqueueInput) {
  if (!env.ODOO_ENABLED) return null

  const operation = normalizeOperation(input.operation)
  const lastError = (input.lastError ?? input.error ?? 'Sync Odoo fallita').slice(0, 2000)

  const existing = await prisma.odooSyncQueue.findFirst({
    where: {
      pwaOrderId: input.pwaOrderId,
      operation,
      status: 'PENDING',
    },
  })

  const nextRetryAt = new Date(Date.now() + backoffMs(existing?.attempts ?? 0))
  const payload = input.payload ?? {}

  if (existing) {
    return prisma.odooSyncQueue.update({
      where: { id: existing.id },
      data: {
        lastError,
        nextRetryAt,
        payload,
      },
    })
  }

  return prisma.odooSyncQueue.create({
    data: {
      pwaOrderId: input.pwaOrderId,
      operation,
      payload,
      lastError,
      nextRetryAt,
    },
  })
}

export const odooSyncQueueService = {
  enqueueFailure: enqueueOdooSyncFailure,

  async list(query: {
    page: number
    pageSize: number
    status?: OdooSyncQueueStatus
    pwaOrderId?: string
  }): Promise<OdooSyncQueueListDTO> {
    const where: Prisma.OdooSyncQueueWhereInput = {
      ...(query.pwaOrderId ? { pwaOrderId: query.pwaOrderId } : {}),
      ...(query.status ? { status: query.status } : { status: { in: ['PENDING', 'EXHAUSTED'] } }),
    }

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.odooSyncQueue.count({ where }),
      prisma.odooSyncQueue.findMany({
        where,
        include: { order: { select: { email: true, odooSaleOrderId: true } } },
        orderBy: [{ nextRetryAt: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: query.pageSize,
      }),
    ])

    return {
      items: rows.map(mapQueueItem),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      configured: isOdooConfigured(),
    }
  },

  async findActiveForOrder(pwaOrderId: string): Promise<OdooSyncQueueItemDTO | null> {
    const row = await prisma.odooSyncQueue.findFirst({
      where: {
        pwaOrderId,
        status: { in: ['PENDING', 'EXHAUSTED'] },
      },
      include: { order: { select: { email: true, odooSaleOrderId: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return row ? mapQueueItem(row) : null
  },

  async retryById(id: string, req?: Request): Promise<OdooSyncQueueItemDTO> {
    const row = await prisma.odooSyncQueue.findUnique({
      where: { id },
      include: { order: { select: { email: true, odooSaleOrderId: true } } },
    })
    if (!row) {
      throw new AppError('SYNC_QUEUE_NOT_FOUND', 'Queue item not found', 'Sync non trovata.', 404, false)
    }
    if (row.status === 'COMPLETED') {
      throw new AppError('SYNC_ALREADY_DONE', 'Already completed', 'Sync già completata.', 409, false)
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

    const ctx: OdooCallContext = { correlationId: req?.correlationId ?? `admin-retry-${id}`, req }
    await prisma.odooSyncQueue.update({
      where: { id },
      data: { status: 'PROCESSING' },
    })

    try {
      await executeQueueOperation(ctx, row.operation, row.pwaOrderId, row.payload)
      const completed = await prisma.odooSyncQueue.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          resolvedAt: new Date(),
          lastError: null,
        },
        include: { order: { select: { email: true, odooSaleOrderId: true } } },
      })
      await prisma.pwaOrder.update({
        where: { id: row.pwaOrderId },
        data: { odooLastSyncStatus: 'SYNCED', odooLastSyncAt: new Date() },
      })
      return mapQueueItem(completed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const attempts = row.attempts + 1
      const exhausted = attempts >= row.maxAttempts
      const updated = await prisma.odooSyncQueue.update({
        where: { id },
        data: {
          status: exhausted ? 'EXHAUSTED' : 'PENDING',
          attempts,
          lastError: msg.slice(0, 2000),
          nextRetryAt: exhausted ? row.nextRetryAt : new Date(Date.now() + backoffMs(attempts)),
        },
        include: { order: { select: { email: true, odooSaleOrderId: true } } },
      })
      if (exhausted) {
        logger.warn('odoo.sync_queue_exhausted', {
          queueId: id,
          pwaOrderId: row.pwaOrderId,
          operation: row.operation,
          attempts,
        })
        await notifySyncExhausted({
          queueId: id,
          pwaOrderId: row.pwaOrderId,
          operation: row.operation,
          attempts,
          lastError: msg,
        })
      }
      throw new AppError(
        'ODOO_SYNC_RETRY_FAILED',
        'Retry failed',
        exhausted
          ? 'Sync Odoo esaurita: contattare il supporto tecnico.'
          : `Retry fallito: ${msg}`,
        exhausted ? 422 : 502,
        !exhausted,
        { queueItem: mapQueueItem(updated) },
      )
    }
  },

  async processDueItems(correlationId = 'odoo-sync-retry-job'): Promise<{ processed: number; failed: number }> {
    if (!env.ODOO_ENABLED || !isOdooConfigured()) {
      return { processed: 0, failed: 0 }
    }

    const due = await prisma.odooSyncQueue.findMany({
      where: {
        status: 'PENDING',
        nextRetryAt: { lte: new Date() },
      },
      orderBy: { nextRetryAt: 'asc' },
      take: 20,
    })

    let processed = 0
    let failed = 0
    const ctx: OdooCallContext = { correlationId }

    for (const row of due) {
      if (row.attempts >= row.maxAttempts) continue
      await prisma.odooSyncQueue.update({
        where: { id: row.id },
        data: { status: 'PROCESSING' },
      })
      try {
        await executeQueueOperation(ctx, row.operation, row.pwaOrderId, row.payload)
        await prisma.odooSyncQueue.update({
          where: { id: row.id },
          data: {
            status: 'COMPLETED',
            resolvedAt: new Date(),
            lastError: null,
          },
        })
        await prisma.pwaOrder.update({
          where: { id: row.pwaOrderId },
          data: { odooLastSyncStatus: 'SYNCED', odooLastSyncAt: new Date() },
        })
        processed += 1
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        const attempts = row.attempts + 1
        const exhausted = attempts >= row.maxAttempts
        await prisma.odooSyncQueue.update({
          where: { id: row.id },
          data: {
            status: exhausted ? 'EXHAUSTED' : 'PENDING',
            attempts,
            lastError: msg.slice(0, 2000),
            nextRetryAt: exhausted ? row.nextRetryAt : new Date(Date.now() + backoffMs(attempts)),
          },
        })
        if (exhausted) {
          logger.warn('odoo.sync_queue_exhausted', {
            queueId: row.id,
            pwaOrderId: row.pwaOrderId,
            operation: row.operation,
            attempts,
          })
          await notifySyncExhausted({
            queueId: row.id,
            pwaOrderId: row.pwaOrderId,
            operation: row.operation,
            attempts,
            lastError: msg,
          })
        }
        failed += 1
      }
    }

    return { processed, failed }
  },
}
