import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { seedDefaultShippingZones } from './modules/shipping/shipping.admin.routes.js'

const app = createApp()

void seedDefaultShippingZones().catch((e) => {
  logger.warn('shipping.seed_failed', { err: String(e) })
})

const server = app.listen(env.PORT, () => {
  logger.info(`API in ascolto sulla porta ${env.PORT}`, { nodeEnv: env.NODE_ENV })
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
