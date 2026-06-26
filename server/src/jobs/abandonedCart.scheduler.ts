import { logger } from '../lib/logger.js'
import { scheduleAbandonedCartProcessing } from './abandonedCart.job.js'
import { syncRetryJobService } from '../modules/sync-retry/sync-retry.service.js'

const ABANDONED_INTERVAL_MS = 60 * 60 * 1000
const SYNC_RETRY_INTERVAL_MS = 5 * 60 * 1000

export function startAbandonedCartScheduler(): void {
  const tick = () => {
    void scheduleAbandonedCartProcessing()
      .then((result) => {
        if (result.marked > 0) {
          logger.info('abandoned_cart.scheduler', result)
        }
      })
      .catch((e) => logger.warn('abandoned_cart.scheduler_failed', { err: String(e) }))
  }
  tick()
  setInterval(tick, ABANDONED_INTERVAL_MS)
}

export function startSyncRetryWorkerScheduler(): void {
  const tick = () => {
    void syncRetryJobService
      .processDueJobs()
      .then((result) => {
        if (result.processed > 0 || result.failed > 0) {
          logger.info('sync_retry.worker', result)
        }
      })
      .catch((e) => logger.warn('sync_retry.worker_failed', { err: String(e) }))
  }
  tick()
  setInterval(tick, SYNC_RETRY_INTERVAL_MS)
}
