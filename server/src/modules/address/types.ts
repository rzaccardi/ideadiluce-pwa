export type ResolvedAddress = {
  line1: string
  streetNumber?: string
  line2?: string
  city: string
  postalCode: string
  country: string
}

export type AddressSuggestion = {
  id: string
  label: string
  resolved?: ResolvedAddress
  provider: 'google' | 'mapbox'
}

export type AddressProviderName = 'google' | 'mapbox'
