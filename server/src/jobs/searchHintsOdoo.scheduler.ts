import { logger } from '../lib/logger.js'
import { refreshSearchHintsFromOdooIfStale } from './searchHintsOdoo.job.js'

/** Controlla ogni ora se i suggerimenti ricerca sono più vecchi di 72h. */
const SEARCH_HINTS_CHECK_INTERVAL_MS = 60 * 60 * 1000
const SEARCH_HINTS_STARTUP_DELAY_MS = 60_000

let timer: ReturnType<typeof setInterval> | null = null
let running = false

async function tick(correlationId: string) {
  if (running) return
  running = true
  try {
    const result = await refreshSearchHintsFromOdooIfStale(correlationId)
    if (result.refreshed) {
      logger.info('search_hints_odoo.scheduler', result)
    }
  } catch (error) {
    logger.warn('search_hints_odoo.scheduler_failed', { err: String(error) })
  } finally {
    running = false
  }
}

export function startSearchHintsOdooScheduler(): void {
  if (timer) return

  setTimeout(() => {
    void tick('search-hints-odoo-startup')
  }, SEARCH_HINTS_STARTUP_DELAY_MS)

  timer = setInterval(() => {
    void tick('search-hints-odoo-interval')
  }, SEARCH_HINTS_CHECK_INTERVAL_MS)
}
