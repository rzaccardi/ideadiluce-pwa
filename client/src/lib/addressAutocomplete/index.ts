import { createGoogleProvider } from './googleProvider'
import { createMapboxProvider } from './mapboxProvider'
import { createApiProvider, fetchAddressAutocompleteStatus } from './apiProvider'
import type { AddressAutocompleteProvider } from './types'
import {
  getGoogleMapsApiKey,
  getMapboxAccessToken,
  getPublicApiUrl,
  isDev,
} from '@/lib/env'

export type { AddressAutocompleteProvider, AddressSuggestion, ResolvedAddress } from './types'
export { fetchAddressAutocompleteStatus, getLastAddressSearchSetupHint } from './apiProvider'
export {
  buildAddressGeocodeQuery,
  hasPrefilledAddress,
  resolvePrefilledAddress,
} from './resolvePrefilledAddress'

let cached: AddressAutocompleteProvider | null | undefined
let serverEnabled: boolean | undefined
let sessionTokenFactory: (() => string | undefined) | null = null

export function setAddressAutocompleteSessionTokenFactory(factory: () => string | undefined) {
  sessionTokenFactory = factory
  cached = undefined
}

function hasClientKeys() {
  return Boolean(getGoogleMapsApiKey() || getMapboxAccessToken())
}

function hasApiBase() {
  if (isDev()) return true
  return Boolean(getPublicApiUrl()?.trim())
}

export function getAddressAutocompleteProvider(): AddressAutocompleteProvider | null {
  const googleKey = getGoogleMapsApiKey()
  const mapboxToken = getMapboxAccessToken()

  if (googleKey) {
    if (!cached) cached = createGoogleProvider(googleKey)
    return cached
  }

  if (mapboxToken) {
    if (!cached) cached = createMapboxProvider(mapboxToken)
    return cached
  }

  if (serverEnabled && hasApiBase()) {
    if (!cached) {
      cached = createApiProvider(() => sessionTokenFactory?.() ?? undefined)
    }
    return cached
  }

  return null
}

export function isAddressAutocompleteEnabled() {
  if (hasClientKeys()) return true
  return serverEnabled === true
}

/** Verifica sul backend se Google/Mapbox sono configurati lato server. */
export async function refreshAddressAutocompleteStatus() {
  if (hasClientKeys()) {
    serverEnabled = true
    return true
  }

  if (!hasApiBase()) {
    serverEnabled = false
    cached = null
    return false
  }

  try {
    const status = await fetchAddressAutocompleteStatus()
    serverEnabled = status.enabled
    cached = status.enabled
      ? createApiProvider(() => sessionTokenFactory?.() ?? undefined)
      : null
    return status.enabled
  } catch {
    serverEnabled = false
    cached = null
    return false
  }
}
