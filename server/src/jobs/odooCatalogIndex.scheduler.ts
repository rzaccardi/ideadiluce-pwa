import { logger } from '../lib/logger.js'
import { isOdooCatalogConfigured } from '../adapters/odoo-catalog/odooCatalogClient.js'
import {
  hydrateOdooCatalogIndexFromDisk,
  syncAllOdooCatalogIndexes,
} from '../modules/catalog/odoo-catalog-index.service.js'

const CHECK_INTERVAL_MS = 60_000
const STARTUP_DELAY_MS = 20_000
const ROME_TZ = 'Europe/Rome'

let timer: ReturnType<typeof setInterval> | null = null
let running = false
/** YYYY-MM-DD in Europe/Rome dell'ultimo sync notturno riuscito. */
let lastNightlyRunDate: string | null = null

function romeParts(now = new Date()): { date: string; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ROME_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}

function shouldRunNightlySync(now = new Date()): boolean {
  const { date, hour, minute } = romeParts(now)
  if (hour !== 3 || minute > 1) return false
  return lastNightlyRunDate !== date
}

async function runSync(reason: string) {
  if (running) return
  if (!isOdooCatalogConfigured()) {
    logger.info('catalog_index.scheduler_skip', { reason, why: 'odooCatalog_not_configured' })
    return
  }
  running = true
  try {
    const result = await syncAllOdooCatalogIndexes()
    const { date } = romeParts()
    lastNightlyRunDate = date
    logger.info('catalog_index.scheduler', { reason, ...result })
  } catch (err) {
    logger.warn('catalog_index.scheduler_failed', { reason, err: String(err) })
  } finally {
    running = false
  }
}

/**
 * Cache catalogo: hydrate da disco all'avvio; sync completo alle 03:00 Europe/Rome.
 * Se la cache è vuota all'avvio, esegue un sync immediato (dopo delay).
 */
export function startOdooCatalogIndexScheduler(): void {
  if (timer) return

  void hydrateOdooCatalogIndexFromDisk().catch((err) => {
    logger.warn('catalog_index.hydrate_failed', { err: String(err) })
  })

  setTimeout(() => {
    void (async () => {
      const { getOdooCatalogIndexMeta } = await import(
        '../modules/catalog/odoo-catalog-index.service.js'
      )
      const meta = getOdooCatalogIndexMeta('IT')
      if (meta.count === 0) {
        await runSync('startup_empty')
      } else if (meta.stale) {
        // Cache >24h: refresh in background senza bloccare le richieste
        await runSync('startup_stale')
      }
    })()
  }, STARTUP_DELAY_MS)

  timer = setInterval(() => {
    if (shouldRunNightlySync()) {
      void runSync('nightly_03_rome')
    }
  }, CHECK_INTERVAL_MS)
}
