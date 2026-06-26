import { proxy } from 'valtio'

export type ShippingZone = {
  id: string
  name: string
  countries: string[]
  postcodes: string[]
  priority: number
  enabled: boolean
  methods: Array<{
    id: string
    name: string
    type: string
    enabled: boolean
    flatAmountCents: number | null
    freeAboveCents: number | null
    surchargePct: number
  }>
}

export type ShippingCredential = {
  provider: string
  enabled: boolean
  sandbox: boolean
  accountId: string | null
  hasKey: boolean
  hasSecret: boolean
}

export type ShippingSurchargeConfig = {
  dhlBaseCents: number
  fedexBaseCents: number
  dhlLengthCents: number
  lengthThresholdMeters: number
}

export const shippingStore = proxy({
  zones: [] as ShippingZone[],
  credentials: [] as ShippingCredential[],
  surcharges: null as ShippingSurchargeConfig | null,
  isLoading: false,
  isSavingSurcharges: false,
  isSimulating: false,
  error: null as string | null,
  simQuotes: [] as Array<{ label: string; amountCents: number }>,
})
