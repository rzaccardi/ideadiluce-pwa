import { paidSyncAlertService } from '../modules/orders-admin/paid-sync-alert.service.js'
import { logger } from '../lib/logger.js'

const INTERVAL_MS = 5 * 60 * 1000

let timer: ReturnType<typeof setInterval> | null = null
let running = false

export async function processPaidSyncAlerts(): Promise<void> {
  const result = await paidSyncAlertService.processDueAlerts()
  if (result.sent > 0 || result.failed > 0 || result.skipped > 0) {
    logger.info('paid_sync_alert.job', result)
  }
}

export function startPaidSyncAlertScheduler(): void {
  if (timer) return
  timer = setInterval(() => {
    if (running) return
    running = true
    void processPaidSyncAlerts()
      .catch((e) => {
        logger.error('paid_sync_alert.job_error', { error: String(e) })
      })
      .finally(() => {
        running = false
      })
  }, INTERVAL_MS)
  timer.unref?.()
}

export function stopPaidSyncAlertScheduler(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
