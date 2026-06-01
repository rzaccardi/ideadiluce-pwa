export type ShippingAddressInput = {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  postalCode: string
  country: string
  phone?: string
}

export type ShippingQuoteLine = {
  methodRef: string
  carrierCode: string
  serviceCode: string
  label: string
  amountCents: number
  currencyCode: string
  etaDays?: number | null
  source: 'flat' | 'free' | 'dhl' | 'fedex'
}

export type CartWeightInput = {
  totalWeightKg: number
  itemCount: number
}
