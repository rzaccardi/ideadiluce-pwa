export type ShippingAddressInput = {
  firstName: string
  lastName: string
  line1: string
  streetNumber: string
  isSnc: boolean
  line2?: string
  city: string
  postalCode: string
  country: string
  phone?: string
  courierNotes?: string
}

export type ShippingQuoteLine = {
  methodRef: string
  carrierCode: string
  serviceCode: string
  label: string
  amountCents: number
  currencyCode: string
  etaDays?: number | null
  source: 'flat' | 'free' | 'dhl' | 'fedex' | 'pickup'
}

export type CartWeightInput = {
  totalWeightKg: number
  itemCount: number
}
