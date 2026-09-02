import type { Prisma } from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../../lib/prisma.js'
import {
  normalizeOperation,
  type EnqueueOdooSyncInput,
  type OdooSyncQueueOperation,
} from './odoo-sync-operations.js'

export const ODOO_SYNC_BACKOFF_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000, 28_800_000] as const
export const ODOO_SYNC_MAX_ATTEMPTS = ODOO_SYNC_BACKOFF_MS.length

export function backoffMs(attempts: number): number {
  const idx = Math.min(Math.max(attempts, 0), ODOO_SYNC_BACKOFF_MS.length - 1)
  return ODOO_SYNC_BACKOFF_MS[idx]!
}

export async function enqueueOdooSyncOperation(input: EnqueueOdooSyncInput) {
  if (!env.ODOO_ENABLED) return null

  const operation = normalizeOperation(input.operation)
  const lastError = (input.lastError ?? input.error ?? 'Sync Odoo in coda').slice(0, 2000)
  const payload = input.payload ?? {}
  const nextRetryAt = input.immediate ? new Date() : new Date(Date.now() + backoffMs(0))

  const existing = await prisma.odooSyncQueue.findFirst({
    where: {
      operation,
      status: { in: ['PENDING', 'PROCESSING'] },
      ...(input.pwaOrderId ? { pwaOrderId: input.pwaOrderId } : { pwaOrderId: null }),
      ...(input.userId ? { userId: input.userId } : {}),
    },
  })

  if (existing) {
    return prisma.odooSyncQueue.update({
      where: { id: existing.id },
      data: {
        lastError,
        payload,
        nextRetryAt: input.immediate ? new Date() : existing.nextRetryAt,
        pwaOrderId: input.pwaOrderId ?? existing.pwaOrderId,
        userId: input.userId ?? existing.userId,
      },
    })
  }

  return prisma.odooSyncQueue.create({
    data: {
      pwaOrderId: input.pwaOrderId ?? null,
      userId: input.userId ?? null,
      operation,
      payload: payload as Prisma.InputJsonValue,
      lastError,
      nextRetryAt,
      maxAttempts: ODOO_SYNC_MAX_ATTEMPTS,
    },
  })
}

export async function enqueueOdooSyncFailure(input: {
  pwaOrderId: string
  operation: OdooSyncQueueOperation | 'FUNNEL_SYNC' | 'RECONCILE_LINES'
  payload?: Prisma.InputJsonValue
  lastError?: string
  error?: string
}) {
  return enqueueOdooSyncOperation({
    pwaOrderId: input.pwaOrderId,
    operation: input.operation,
    payload: input.payload,
    lastError: input.lastError,
    error: input.error,
  })
}
