import { logger } from '../lib/logger.js'
import { refreshSeoCaches } from '../modules/seo/seo-cache.service.js'

/** Rigenera sitemap, merchant feed e llms.txt ogni ora (+ al primo avvio). */
const SEO_CACHE_INTERVAL_MS = 60 * 60 * 1000
const SEO_CACHE_STARTUP_DELAY_MS = 45_000

export function startSeoCacheScheduler(): void {
  const tick = () => {
    void refreshSeoCaches()
      .then((result) => {
        if (!result.skipped) {
          logger.info('seo.scheduler', result)
        }
      })
      .catch((e) => logger.warn('seo.scheduler_failed', { err: String(e) }))
  }

  setTimeout(tick, SEO_CACHE_STARTUP_DELAY_MS)
  setInterval(tick, SEO_CACHE_INTERVAL_MS)
}
