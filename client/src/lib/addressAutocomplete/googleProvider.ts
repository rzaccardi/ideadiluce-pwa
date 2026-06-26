import type { AddressAutocompleteProvider, AddressSuggestion, ResolvedAddress } from './types'

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string
      text?: { text?: string }
    }
  }>
}

type GooglePlaceResponse = {
  formattedAddress?: string
  addressComponents?: Array<{
    longText?: string
    shortText?: string
    types?: string[]
  }>
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

export function createGoogleProvider(apiKey: string): AddressAutocompleteProvider {
  return {
    async search(query, options) {
      const q = query.trim()
      if (q.length < 3) return []

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
      if (!autocompleteRes.ok) return []

      const autocomplete = (await autocompleteRes.json()) as GoogleAutocompleteResponse
      const suggestions: AddressSuggestion[] = []

      for (const item of autocomplete.suggestions?.slice(0, 8) ?? []) {
        const placeId = item.placePrediction?.placeId
        const label = item.placePrediction?.text?.text
        if (!placeId || !label) continue
        suggestions.push({ id: placeId, label, provider: 'google' })
      }

      return suggestions
    },

    async resolve(id, _provider = 'google', sessionToken?: string) {
      const headers: Record<string, string> = {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'formattedAddress,addressComponents',
      }
      if (sessionToken) headers['X-Goog-Session-Token'] = sessionToken

      const resourceId = id.startsWith('places/') ? id.slice('places/'.length) : id
      const detailRes = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(resourceId)}`,
        { headers },
      )
      if (!detailRes.ok) return null
      const place = (await detailRes.json()) as GooglePlaceResponse
      return parsePlace(place)
    },
  }
}
