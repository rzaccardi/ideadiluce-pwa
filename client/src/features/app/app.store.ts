import { proxy } from 'valtio'

export const appStore = proxy({
  isBootstrapped: false,
  /** Flag globale BO: se false nessun suono UI (chime carrello, ecc.). Default true. */
  soundsEnabled: true,
})
