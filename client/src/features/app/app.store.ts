import { proxy } from 'valtio'

export const DEFAULT_LEGACY_SITE_URL = 'https://old.ideadiluce.it'

export const appStore = proxy({
  isBootstrapped: false,
  /** Flag globale BO: se false nessun suono UI (chime carrello, ecc.). Default true. */
  soundsEnabled: true,
  /** Barra go-live visibile in negozio. Default off finché non si attiva dal BO. */
  legacySiteNoticeEnabled: false,
  legacySiteUrl: DEFAULT_LEGACY_SITE_URL,
})
