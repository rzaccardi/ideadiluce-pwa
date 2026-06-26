import { apiClient } from '@/api/client'
import type { AddressAutocompleteProvider, AddressSuggestion, ResolvedAddress } from './types'

let lastSearchSetupHint: string | null = null

export function getLastAddressSearchSetupHint() {
  return lastSearchSetupHint
}

export function createApiProvider(getSessionToken: () => string | undefined): AddressAutocompleteProvider {
  return {
    async search(query, options) {
      const params = new URLSearchParams({ q: query.trim() })
      if (options?.country) params.set('country', options.country.toUpperCase())
      const token = options?.sessionToken ?? getSessionToken()
      if (token) params.set('sessionToken', token)

      const res = await apiClient.get<{
        suggestions: AddressSuggestion[]
        setupHint?: string | null
      }>(`/api/v1/address/search?${params}`)

      lastSearchSetupHint = res.setupHint ?? null
      return res.suggestions
    },

    async resolve(id, provider = 'google', sessionToken?: string) {
      const params = new URLSearchParams({ id, provider })
      const token = sessionToken ?? getSessionToken()
      if (token) params.set('sessionToken', token)

      const { address } = await apiClient.get<{ address: ResolvedAddress | null }>(
        `/api/v1/address/resolve?${params}`,
      )
      return address
    },
  }
}

export async function fetchAddressAutocompleteStatus() {
  return apiClient.get<{
    enabled: boolean
    provider: 'google' | 'mapbox' | null
    setupHint?: string | null
  }>('/api/v1/address/status')
}
