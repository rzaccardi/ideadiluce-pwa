import { env } from './env.js'

export type StorePickupLocation = {
  label: string
  line1: string
  postalCode: string
  city: string
  country: string
  displayAddress: string
}

/** Sede ritiro unica — configurabile via env, usata in shipping, footer e thank-you. */
export function getStorePickupLocation(): StorePickupLocation {
  const line1 = env.STORE_PICKUP_LINE1?.trim() || 'Via Appia Pignatelli 450'
  const postalCode = env.STORE_PICKUP_POSTAL_CODE?.trim() || '00178'
  const city = env.STORE_PICKUP_CITY?.trim() || 'Roma'
  const country = env.STORE_PICKUP_COUNTRY?.trim() || 'IT'
  const label =
    env.STORE_PICKUP_LABEL?.trim() || `Ritiro gratuito — ${line1}, ${city}`
  const displayAddress = `${line1}, ${postalCode} ${city}${country !== 'IT' ? ` (${country})` : ''}`
  return { label, line1, postalCode, city, country, displayAddress }
}
