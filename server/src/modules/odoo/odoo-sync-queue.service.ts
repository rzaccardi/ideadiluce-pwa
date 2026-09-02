import type { OdooSyncQueueStatus, Prisma } from '@prisma/client'
import type { Request } from 'express'
import { isOdooConfigured, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../types/errors.js'
import type { OdooSyncQueueItemDTO, OdooSyncQueueListDTO } from '../../types/odoo.dto.js'
import { sendPwaMail, PWA_ADMIN_MAIL_TO } from '../../adapters/odoo/odooMailAdapter.js'
import { earlierSagaOperations, toOperationDto } from './odoo-sync-operations.js'
import { executeQueueOperation } from './odoo-sync-saga.js'
import {
  backoffMs,
  enqueueOdooSyncFailure,
  enqueueOdooSyncOperation,
} from './odoo-sync-queue.enqueue.js'

export {
  enqueueOdooSyncFailure,
  enqueueOdooSyncOperation,
  ODOO_SYNC_BACKOFF_MS,
  ODOO_SYNC_MAX_ATTEMPTS,
} from './odoo-sync-queue.enqueue.js'
export type { OdooSyncQueueOperation } from './odoo-sync-operations.js'
export { enqueueOrderOdooSaga, enqueueUserOdooSaga } from './odoo-sync-saga.js'

async function notifySyncExhausted(
  ctx: OdooCallContext,
  input: {
    queueId: string
    pwaOrderId: string | null
    operation: string
    attempts: number
    lastError: string
  },
) {
  try {
    await sendPwaMail(ctx, {
      templateKey: 'sync_exhausted_admin',
      emailTo: PWA_ADMIN_MAIL_TO,
      vars: {
        pwa_order_id: input.pwaOrderId ?? '',
        body_text: [
          'Tipo: Coda sync Odoo — tentativi esauriti',
          `ID coda: ${input.queueId}`,
          `Ordine PWA: ${input.pwaOrderId ?? '—'}`,
          `Operazione: ${input.operation}`,
          `Tentativi: ${input.attempts}`,
          '',
          input.lastError,
        ].join('\n'),
      },
    })
  } catch (e) {
    logger.warn('odoo.sync_queue_exhausted_mail_failed', {
      queueId: input.queueId,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

type QueueRow = Prisma.OdooSyncQueueGetPayload<{
  include: { order: { select: { email: true; odooSaleOrderId: true } } }
}>

function mapQueueItem(row: QueueRow): OdooSyncQueueItemDTO {
  return {
    id: row.id,
    pwaOrderId: row.pwaOrderId,
    userId: row.userId,
    operation: toOperationDto(row.operation),
    status: row.status as OdooSyncQueueItemDTO['status'],
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    nextRetryAt: row.nextRetryAt.toISOString(),
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.resolvedAt?.toISOString() ?? null,
    orderEmail: row.order?.email ?? null,
    odooSaleOrderId: row.order?.odooSaleOrderId ?? null,
  }
}

const queueInclude = { order: { select: { email: true, odooSaleOrderId: true } } } as const

async function shouldDeferForSaga(row: {
  pwaOrderId: string | null
  userId: string | null
  operation: string
}): Promise<boolean> {
  const earlier = earlierSagaOperations(row.operation)
  if (earlier.length === 0) return false
  const scope = row.pwaOrderId
    ? { pwaOrderId: row.pwaOrderId }
    : row.userId
      ? { userId: row.userId, pwaOrderId: null }
      : null
  if (!scope) return false
  const blocking = await prisma.odooSyncQueue.findFirst({
    where: {
      ...scope,
      operation: { in: [...earlier] },
      status: { in: ['PENDING', 'PROCESSING', 'EXHAUSTED'] },
    },
    select: { id: true },
  })
  return blocking != null
}

async function markFailed(
  ctx: OdooCallContext,
  row: { id: string; pwaOrderId: string | null; operation: string; attempts: number; maxAttempts: number; nextRetryAt: Date },
  message: string,
) {
  const attempts = row.attempts + 1
  const exhausted = attempts >= row.maxAttempts
  const updated = await prisma.odooSyncQueue.update({
    where: { id: row.id },
    data: {
      status: exhausted ? 'EXHAUSTED' : 'PENDING',
      attempts,
      lastError: message.slice(0, 2000),
      nextRetryAt: exhausted ? row.nextRetryAt : new Date(Date.now() + backoffMs(attempts)),
    },
    include: queueInclude,
  })
  if (exhausted) {
    logger.warn('odoo.sync_queue_exhausted', {
      queueId: row.id,
      pwaOrderId: row.pwaOrderId,
      operation: row.operation,
      attempts,
    })
    await notifySyncExhausted(ctx, {
      queueId: row.id,
      pwaOrderId: row.pwaOrderId,
      operation: row.operation,
      attempts,
      lastError: message,
    })
  }
  return { updated, exhausted }
}

export const odooSyncQueueService = {
  enqueueFailure: enqueueOdooSyncFailure,
  enqueue: enqueueOdooSyncOperation,

  async list(query: {
    page: number
    pageSize: number
    status?: OdooSyncQueueStatus
    pwaOrderId?: string
  }): Promise<OdooSyncQueueListDTO> {
    const where: Prisma.OdooSyncQueueWhereInput = {
      ...(query.pwaOrderId ? { pwaOrderId: query.pwaOrderId } : {}),
      ...(query.status ? { status: query.status } : { status: { in: ['PENDING', 'EXHAUSTED', 'PROCESSING'] } }),
    }

    const skip = (query.page - 1) * query.pageSize
    const [total, rows] = await Promise.all([
      prisma.odooSyncQueue.count({ where }),
      prisma.odooSyncQueue.findMany({
        where,
        include: queueInclude,
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

  async counts(): Promise<{ pending: number; exhausted: number }> {
    const [pending, exhausted] = await Promise.all([
      prisma.odooSyncQueue.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
      prisma.odooSyncQueue.count({ where: { status: 'EXHAUSTED' } }),
    ])
    return { pending, exhausted }
  },

  async findActiveForOrder(pwaOrderId: string): Promise<OdooSyncQueueItemDTO | null> {
    const row = await prisma.odooSyncQueue.findFirst({
      where: {
        pwaOrderId,
        status: { in: ['PENDING', 'EXHAUSTED', 'PROCESSING'] },
      },
      include: queueInclude,
      orderBy: { createdAt: 'desc' },
    })
    return row ? mapQueueItem(row) : null
  },

  async retryById(id: string, req?: Request): Promise<OdooSyncQueueItemDTO> {
    const row = await prisma.odooSyncQueue.findUnique({
      where: { id },
      include: queueInclude,
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
      await executeQueueOperation(ctx, row.operation, row.pwaOrderId, row.userId, row.payload)
      const completed = await prisma.odooSyncQueue.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          resolvedAt: new Date(),
          lastError: null,
        },
        include: queueInclude,
      })
      if (row.pwaOrderId) {
        await prisma.pwaOrder.update({
          where: { id: row.pwaOrderId },
          data: { odooLastSyncStatus: 'SYNCED', odooLastSyncAt: new Date() },
        })
      }
      return mapQueueItem(completed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const { updated, exhausted } = await markFailed(ctx, row, msg)
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

  async requeueExhausted(): Promise<{ requeued: number }> {
    const result = await prisma.odooSyncQueue.updateMany({
      where: { status: 'EXHAUSTED' },
      data: {
        status: 'PENDING',
        nextRetryAt: new Date(),
        lastError: 'Reimmesso in coda dopo ripristino Odoo.',
      },
    })
    return { requeued: result.count }
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
      if (await shouldDeferForSaga(row)) continue

      await prisma.odooSyncQueue.update({
        where: { id: row.id },
        data: { status: 'PROCESSING' },
      })
      try {
        await executeQueueOperation(ctx, row.operation, row.pwaOrderId, row.userId, row.payload)
        await prisma.odooSyncQueue.update({
          where: { id: row.id },
          data: {
            status: 'COMPLETED',
            resolvedAt: new Date(),
            lastError: null,
          },
        })
        if (row.pwaOrderId) {
          await prisma.pwaOrder.update({
            where: { id: row.pwaOrderId },
            data: { odooLastSyncStatus: 'SYNCED', odooLastSyncAt: new Date() },
          })
        }
        processed += 1
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await markFailed(ctx, row, msg)
        failed += 1
      }
    }

    return { processed, failed }
  },
}
