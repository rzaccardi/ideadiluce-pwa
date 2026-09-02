import { logger } from '../lib/logger.js'
import { isOdooCatalogConfigured } from '../adapters/odoo-catalog/odooCatalogClient.js'
import { HUB_LOCALES } from '../lib/hub-locale.js'
import { listResumableCheckpoints } from '../modules/catalog/odoo-catalog-index-checkpoint.js'
import {
  CATALOG_INDEX_REFRESH_HOURS_ROME,
  CATALOG_INDEX_REFRESH_TZ,
  getOdooCatalogIndexMeta,
  hydrateOdooCatalogIndexFromDisk,
  syncAllOdooCatalogIndexes,
} from '../modules/catalog/odoo-catalog-index.service.js'

const CHECK_INTERVAL_MS = 60_000
const STARTUP_DELAY_MS = 20_000

let timer: ReturnType<typeof setInterval> | null = null
let running = false
/** Slot `YYYY-MM-DDTHH` Europe/Rome dell'ultimo sync schedulato avviato. */
let lastScheduledSlot: string | null = null

export function romeParts(now = new Date()): { date: string; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CATALOG_INDEX_REFRESH_TZ,
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

export function catalogIndexRefreshSlot(now = new Date()): string {
  const { date, hour } = romeParts(now)
  return `${date}T${String(hour).padStart(2, '0')}`
}

/**
 * True nella finestra di 2 minuti alle 03:00 e 15:00 Europe/Rome, se lo slot
 * non è già stato eseguito (refresh cache typeahead ogni 12h).
 */
export function shouldRunScheduledCatalogIndexSync(
  now = new Date(),
  lastSlot = lastScheduledSlot,
): { shouldRun: boolean; slot: string } {
  const { hour, minute } = romeParts(now)
  const slot = catalogIndexRefreshSlot(now)
  const inWindow =
    (CATALOG_INDEX_REFRESH_HOURS_ROME as readonly number[]).includes(hour) && minute <= 1
  return { shouldRun: inWindow && lastSlot !== slot, slot }
}

async function runSync(reason: string, slot: string | null) {
  if (running) return
  if (!isOdooCatalogConfigured()) {
    logger.info('catalog_index.scheduler_skip', { reason, why: 'odooCatalog_not_configured' })
    return
  }
  running = true
  if (slot) lastScheduledSlot = slot
  try {
    const result = await syncAllOdooCatalogIndexes({ reason, force: false })
    logger.info('catalog_index.scheduler', { reason, slot, ...result })
  } catch (err) {
    if (slot) lastScheduledSlot = null
    logger.warn('catalog_index.scheduler_failed', { reason, slot, err: String(err) })
  } finally {
    running = false
  }
}

/**
 * Cache catalogo: hydrate da disco all'avvio; sync completo alle 03:00 e 15:00 Europe/Rome.
 * Se esiste un checkpoint incompleto, lo riprende. Se la cache è vuota o stale, parte un sync.
 */
export function startOdooCatalogIndexScheduler(): void {
  if (timer) return

  void hydrateOdooCatalogIndexFromDisk().catch((err) => {
    logger.warn('catalog_index.hydrate_failed', { err: String(err) })
  })

  setTimeout(() => {
    void (async () => {
      await hydrateOdooCatalogIndexFromDisk()
      const checkpoints = await listResumableCheckpoints(HUB_LOCALES)
      const anyIncomplete = checkpoints.length > 0
      const anyEmpty = HUB_LOCALES.some((locale) => getOdooCatalogIndexMeta(locale).count === 0)
      const anyStale = HUB_LOCALES.some((locale) => getOdooCatalogIndexMeta(locale).stale)
      const { shouldRun, slot } = shouldRunScheduledCatalogIndexSync()
      if (anyIncomplete) {
        await runSync('startup_resume', shouldRun ? slot : null)
      } else if (anyEmpty) {
        await runSync('startup_empty', shouldRun ? slot : null)
      } else if (anyStale) {
        await runSync('startup_stale', shouldRun ? slot : null)
      }
    })()
  }, STARTUP_DELAY_MS)

  timer = setInterval(() => {
    const { shouldRun, slot } = shouldRunScheduledCatalogIndexSync()
    if (shouldRun) {
      void runSync('scheduled_12h', slot)
    }
  }, CHECK_INTERVAL_MS)
}
