import { adminApi } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import {
  shippingStore,
  type ShippingCredential,
  type ShippingSurchargeConfig,
  type ShippingZone,
} from './shipping.store'

function errMessage(e: unknown) {
  return String(e)
}

async function loadShipping() {
  shippingStore.isLoading = true
  shippingStore.error = null
  try {
    const [zones, credentials, surcharges] = await Promise.all([
      adminApi<ShippingZone[]>('/admin/shipping/zones'),
      adminApi<ShippingCredential[]>('/admin/shipping/credentials'),
      adminApi<ShippingSurchargeConfig>('/admin/shipping/surcharges'),
    ])
    shippingStore.zones = zones
    shippingStore.credentials = credentials
    shippingStore.surcharges = surcharges
  } catch (e) {
    shippingStore.error = errMessage(e)
  } finally {
    shippingStore.isLoading = false
  }
}

export function fetchShipping() {
  return dedupeAsync('admin:shipping', loadShipping)
}

export async function saveShippingCredential(
  provider: 'DHL' | 'FEDEX',
  body: Record<string, unknown>,
) {
  await adminApi('/admin/shipping/credentials', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  await fetchShipping()
}

export async function simulateShipping(shippingAddress: Record<string, string | boolean>) {
  shippingStore.isSimulating = true
  shippingStore.simQuotes = []
  shippingStore.error = null
  try {
    shippingStore.simQuotes = await adminApi<Array<{ label: string; amountCents: number }>>(
      '/admin/shipping/simulate',
      {
        method: 'POST',
        body: JSON.stringify({ shippingAddress }),
      },
    )
  } catch (e) {
    shippingStore.error = errMessage(e)
  } finally {
    shippingStore.isSimulating = false
  }
}

export async function saveShippingSurcharges(body: Partial<ShippingSurchargeConfig>) {
  shippingStore.isSavingSurcharges = true
  shippingStore.error = null
  try {
    shippingStore.surcharges = await adminApi<ShippingSurchargeConfig>('/admin/shipping/surcharges', {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  } catch (e) {
    shippingStore.error = errMessage(e)
    throw e
  } finally {
    shippingStore.isSavingSurcharges = false
  }
}
