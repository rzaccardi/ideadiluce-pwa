import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { isGoogleMapsConfigured } from './modules/address/googleConfig.js'
import { seedDefaultShippingZones } from './modules/shipping/shipping.admin.routes.js'
import { seedDefaultTaxRules } from './modules/tax/tax.admin.routes.js'
import { startPaidSyncAlertScheduler } from './jobs/paidSyncAlert.scheduler.js'
import { startOdooSyncRetryScheduler } from './jobs/odooSyncRetry.scheduler.js'
import {
  startAbandonedCartScheduler,
  startSyncRetryWorkerScheduler,
} from './jobs/abandonedCart.scheduler.js'
import { startSeoCacheScheduler } from './jobs/seoCache.scheduler.js'

const app = createApp()

void seedDefaultShippingZones().catch((e) => {
  logger.warn('shipping.seed_failed', { err: String(e) })
})

void seedDefaultTaxRules().catch((e) => {
  logger.warn('tax.seed_failed', { err: String(e) })
})

void import('./modules/site-guides/site-guides.service.js')
  .then(({ siteGuideService }) => siteGuideService.ensureSiteGuidesSeeded())
  .catch((e) => {
    logger.warn('site_guides.seed_failed', { err: String(e) })
  })

startOdooSyncRetryScheduler()
startPaidSyncAlertScheduler()
startAbandonedCartScheduler()
startSyncRetryWorkerScheduler()
startSeoCacheScheduler()

const server = app.listen(env.PORT, () => {
  logger.info(`API in ascolto sulla porta ${env.PORT}`, { nodeEnv: env.NODE_ENV })
  if (isGoogleMapsConfigured()) {
    logger.info('Google Places autocomplete attivo (checkout indirizzi)')
  } else if (env.GOOGLE_MAPS_API_KEY?.trim()) {
    logger.warn(
      'GOOGLE_MAPS_API_KEY impostata ma non valida (placeholder o troppo corta). Autocomplete indirizzi disattivato.',
    )
  }
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(
      `La porta ${env.PORT} è già in uso. Chiudi l'istanza precedente (es. altro npm run dev) o imposta PORT nel file .env.`,
      { code: err.code, message: err.message },
    )
  } else {
    logger.error('Impossibile avviare il server.', { code: err.code, message: err.message })
  }
  process.exit(1)
})
