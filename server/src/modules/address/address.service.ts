import { env } from '../../config/env.js'
import { getAddressSetupHint } from './googlePlaces.js'
import { googleMapsApiKey, isGoogleMapsConfigured } from './googleConfig.js'
import { googleResolve, googleSearch } from './googlePlaces.js'
import { mapboxSearch } from './mapboxGeocoding.js'
import type { AddressProviderName, AddressSuggestion, ResolvedAddress } from './types.js'

export type AddressSearchResponse = {
  suggestions: AddressSuggestion[]
  setupHint?: string | null
}

function isMapboxConfigured() {
  return Boolean(env.MAPBOX_ACCESS_TOKEN?.trim())
}

function activeProvider(): AddressProviderName | null {
  if (isGoogleMapsConfigured()) return 'google'
  if (isMapboxConfigured()) return 'mapbox'
  return null
}

let statusProbeDone = false

export const addressService = {
  status() {
    const provider = activeProvider()
    if (provider === 'google' && !statusProbeDone) {
      statusProbeDone = true
      const key = googleMapsApiKey()
      if (key) void googleSearch(key, 'Via Roma', { country: 'IT' })
    }
    return {
      enabled: provider != null,
      provider,
      setupHint: provider === 'google' ? getAddressSetupHint() : null,
    }
  },

  async search(
    query: string,
    options?: { country?: string; sessionToken?: string },
  ): Promise<AddressSearchResponse> {
    const provider = activeProvider()
    if (!provider) return { suggestions: [] }

    if (provider === 'google') {
      const key = googleMapsApiKey()
      if (!key) return { suggestions: [] }

      const { suggestions, failed } = await googleSearch(key, query, options)
      const setupHint = failed || (suggestions.length === 0 && getAddressSetupHint())
        ? getAddressSetupHint()
        : null
      return { suggestions, setupHint }
    }

    const suggestions = await mapboxSearch(env.MAPBOX_ACCESS_TOKEN!.trim(), query, options?.country)
    return { suggestions }
  },

  async resolve(
    id: string,
    provider: AddressProviderName,
    sessionToken?: string,
  ): Promise<ResolvedAddress | null> {
    if (provider === 'google') {
      const key = googleMapsApiKey()
      if (!key) return null
      return googleResolve(key, id, sessionToken)
    }
    return null
  },
}
