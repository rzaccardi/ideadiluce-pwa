import { logger } from '../lib/logger.js'
import { odooSyncQueueService } from '../modules/odoo/odoo-sync-queue.service.js'

export async function processOdooSyncRetryQueue(): Promise<{ processed: number; failed: number }> {
  const result = await odooSyncQueueService.processDueItems()
  if (result.processed > 0 || result.failed > 0) {
    logger.info('odoo.sync_retry_job', result)
  }
  return result
}

export async function scheduleOdooSyncRetryProcessing(): Promise<{ processed: number; failed: number }> {
  return processOdooSyncRetryQueue()
}
