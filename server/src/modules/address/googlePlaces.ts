import { logger } from '../../lib/logger.js'
import { env } from '../../config/env.js'
import type { AddressSuggestion, ResolvedAddress } from './types.js'

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
    }
  }>
  error?: { message?: string; status?: string }
}

type GooglePlaceResponse = {
  formattedAddress?: string
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
  error?: { message?: string; status?: string }
}

function component(
  components: NonNullable<GooglePlaceResponse['addressComponents']>,
  type: string,
  short = false,
) {
  const hit = components.find((c) => c.types?.includes(type))
  return (short ? hit?.shortText : hit?.longText) ?? ''
}

function parsePlace(place: GooglePlaceResponse): ResolvedAddress | null {
  const components = place.addressComponents
  if (!components?.length) return null

  const route = component(components, 'route')
  const streetNumber = component(components, 'street_number')
  const line1 =
    route.trim() ||
    place.formattedAddress?.split(',')[0]?.trim() ||
    ''
  const line2 = component(components, 'subpremise') || undefined
  const city =
    component(components, 'locality') ||
    component(components, 'administrative_area_level_3') ||
    component(components, 'postal_town')
  const postalCode = component(components, 'postal_code')
  const country = component(components, 'country', true).toUpperCase().slice(0, 2)

  if (!line1 || !city || !postalCode || !country) return null

  return {
    line1,
    streetNumber: streetNumber.trim() || undefined,
    line2,
    city,
    postalCode,
    country,
  }
}

let lastSetupHint: string | null = null

export function getAddressSetupHint() {
  return lastSetupHint
}

function logGoogleError(context: string, status: number, body: unknown) {
  const raw = typeof body === 'object' ? JSON.stringify(body) : String(body)
  if (status === 403 && raw.includes('API_KEY_SERVICE_BLOCKED')) {
    lastSetupHint =
      'La chiave in GOOGLE_MAPS_API_KEY è bloccata: Google Cloud → Credenziali → apri quella chiave. ' +
      'Restrizioni applicazione: per il server usa "Nessuna" (dev) o "Indirizzi IP", non "Siti web". ' +
      'Restrizioni API: includi "Places API (New)". Verifica che sia la stessa chiave del .env e del progetto dove hai abilitato le API.'
  } else if (status === 403) {
    lastSetupHint =
      'Accesso negato a Google Places: controlla fatturazione attiva, Places API (New) abilitata e restrizioni della chiave API.'
  }
  if (env.NODE_ENV === 'production') return
  logger.warn('google_places.request_failed', {
    context,
    status,
    body: typeof body === 'object' ? body : String(body),
  })
}

export async function googleSearch(
  apiKey: string,
  query: string,
  options?: { country?: string; sessionToken?: string },
): Promise<{ suggestions: AddressSuggestion[]; failed: boolean }> {
  const q = query.trim()
  if (q.length < 3) return { suggestions: [], failed: false }

  const body: Record<string, unknown> = {
    input: q,
    languageCode: 'it',
  }
  if (options?.country) body.includedRegionCodes = [options.country.toUpperCase()]
  if (options?.sessionToken) body.sessionToken = options.sessionToken

  const autocompleteRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const autocomplete = (await autocompleteRes.json()) as GoogleAutocompleteResponse
  if (!autocompleteRes.ok) {
    logGoogleError('autocomplete', autocompleteRes.status, autocomplete)
    return { suggestions: [], failed: true }
  }

  const suggestions: AddressSuggestion[] = []

  for (const item of autocomplete.suggestions?.slice(0, 8) ?? []) {
    const placeId = item.placePrediction?.placeId
    const label = item.placePrediction?.text?.text
    if (!placeId || !label) continue
    suggestions.push({ id: placeId, label, provider: 'google' })
  }

  return { suggestions, failed: false }
}

export async function googleResolve(
  apiKey: string,
  placeId: string,
  sessionToken?: string,
): Promise<ResolvedAddress | null> {
  const headers: Record<string, string> = {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'formattedAddress,addressComponents',
  }
  if (sessionToken) headers['X-Goog-Session-Token'] = sessionToken

  const resourceId = placeId.startsWith('places/') ? placeId.slice('places/'.length) : placeId
  const detailRes = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(resourceId)}`,
    { headers },
  )

  const place = (await detailRes.json()) as GooglePlaceResponse
  if (!detailRes.ok) {
    logGoogleError('place_details', detailRes.status, place)
    return null
  }

  return parsePlace(place)
}
