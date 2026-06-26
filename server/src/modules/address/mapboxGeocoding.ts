import type { AddressSuggestion, ResolvedAddress } from './types.js'

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
  const street = feature.address
    ? `${feature.address} ${feature.text ?? ''}`.trim()
    : (feature.text ?? feature.place_name.split(',')[0] ?? '')

  if (!street || !place || !postal) return null

  return { line1: street, city: place, postalCode: postal, country }
}

export async function mapboxSearch(
  token: string,
  query: string,
  country?: string,
): Promise<AddressSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const params = new URLSearchParams({
    access_token: token,
    language: 'it',
    types: 'address',
    limit: '6',
    autocomplete: 'true',
  })
  if (country) params.set('country', country.toLowerCase())

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
}
