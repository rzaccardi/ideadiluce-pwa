import { prisma } from '../../lib/prisma.js'
import { logger } from '../../lib/logger.js'
import { processOdooSyncRetryQueue } from '../../jobs/odooSyncRetry.job.js'

export const syncRetryJobService = {
  async enqueue(input: {
    service: string
    operation: string
    entityType: string
    entityId: string
    payload?: Record<string, unknown>
  }) {
    return prisma.syncRetryJob.create({
      data: {
        service: input.service,
        operation: input.operation,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: (input.payload ?? {}) as object,
      },
    })
  },

  /** Worker stub: delega alle code Odoo esistenti e marca job completati. */
  async processDueJobs(): Promise<{ processed: number; failed: number }> {
    const due = await prisma.syncRetryJob.findMany({
      where: { status: 'PENDING', nextRetryAt: { lte: new Date() } },
      take: 20,
      orderBy: { nextRetryAt: 'asc' },
    })

    let processed = 0
    let failed = 0

    for (const job of due) {
      await prisma.syncRetryJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING', attempts: { increment: 1 } },
      })

      try {
        if (job.service === 'odoo') {
          await processOdooSyncRetryQueue()
        }
        await prisma.syncRetryJob.update({
          where: { id: job.id },
          data: { status: 'COMPLETED', resolvedAt: new Date(), lastError: null },
        })
        processed += 1
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        const exhausted = job.attempts + 1 >= job.maxAttempts
        await prisma.syncRetryJob.update({
          where: { id: job.id },
          data: {
            status: exhausted ? 'FAILED' : 'PENDING',
            lastError: message,
            nextRetryAt: new Date(Date.now() + 5 * 60_000),
          },
        })
        failed += 1
        logger.warn('sync_retry.job_failed', { jobId: job.id, err: message })
      }
    }

    return { processed, failed }
  },
}
