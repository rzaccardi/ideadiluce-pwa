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
  /** Presente subito (es. Mapbox); altrimenti usa resolve() */
  resolved?: ResolvedAddress
  provider?: 'google' | 'mapbox'
}

export type AddressSearchOptions = {
  country?: string
  sessionToken?: string
}

export type AddressAutocompleteProvider = {
  search: (query: string, options?: AddressSearchOptions) => Promise<AddressSuggestion[]>
  resolve?: (
    id: string,
    provider?: 'google' | 'mapbox',
    sessionToken?: string,
  ) => Promise<ResolvedAddress | null>
}
