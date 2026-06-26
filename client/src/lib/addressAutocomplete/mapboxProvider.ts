import type { AddressAutocompleteProvider, AddressSuggestion, ResolvedAddress } from './types'

type MapboxFeature = {
  id: string
  place_name: string
  address?: string
  text?: string
  context?: Array<{ id: string; text: string; short_code?: string }>
}

function parseFeature(feature: MapboxFeature): ResolvedAddress | null {
  const ctx = feature.context ?? []
  const postal = ctx.find((c) => c.id.startsWith('postcode.'))?.text ?? ''
  const place = ctx.find((c) => c.id.startsWith('place.'))?.text ?? ''
  const countryCtx = ctx.find((c) => c.id.startsWith('country.'))
  const country = countryCtx?.short_code?.toUpperCase().slice(0, 2) ?? 'IT'
  const streetName = feature.text ?? feature.place_name.split(',')[0] ?? ''
  const streetNumber = feature.address?.trim() ?? ''

  if (!streetName || !place || !postal) return null

  return {
    line1: streetName,
    streetNumber: streetNumber || undefined,
    city: place,
    postalCode: postal,
    country,
  }
}

export function createMapboxProvider(token: string): AddressAutocompleteProvider {
  return {
    async search(query, options) {
      const q = query.trim()
      if (q.length < 3) return []

      const params = new URLSearchParams({
        access_token: token,
        language: 'it',
        types: 'address',
        limit: '6',
        autocomplete: 'true',
      })
      if (options?.country) params.set('country', options.country.toLowerCase())

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params}`,
      )
      if (!res.ok) return []

      const data = (await res.json()) as { features?: MapboxFeature[] }
      const suggestions: AddressSuggestion[] = []

      for (const feature of data.features ?? []) {
        const resolved = parseFeature(feature)
        if (!resolved) continue
        suggestions.push({
          id: feature.id,
          label: feature.place_name,
          resolved,
          provider: 'mapbox',
        })
      }

      return suggestions
    },
  }
}
