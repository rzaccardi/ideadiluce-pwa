import { describe, expect, it } from 'vitest'
import type { OdooApiShipment } from '../../adapters/odoo-api/odooApi.types.js'
import { odooUtcDateTimeToIso } from '../../adapters/odoo-api/odooApi.mapping.js'

/** Replica della logica di mapping usata in order-shipment.service (testabile in isolamento). */
function mapDeliveryStatus(
  deliveryStatus: OdooApiShipment['delivery_status'],
  warehouseState: string,
  hasTracking: boolean,
): { status: string; fromOdoo: boolean; deliveredAt: string | null } {
  const key = (deliveryStatus ?? '').toLowerCase()
  if (key === 'delivered') {
    return {
      status: 'delivered',
      fromOdoo: true,
      deliveredAt: odooUtcDateTimeToIso('2026-10-03 14:22:00'),
    }
  }
  if (key === 'exception') return { status: 'exception', fromOdoo: true, deliveredAt: null }
  if (key === 'in_transit') return { status: 'in_transit', fromOdoo: true, deliveredAt: null }
  if (key === 'pending') {
    return { status: hasTracking ? 'shipped' : 'preparing', fromOdoo: true, deliveredAt: null }
  }
  const state = warehouseState.toLowerCase()
  if (state === 'done' || state === 'delivered') {
    return { status: 'shipped', fromOdoo: false, deliveredAt: null }
  }
  if (state === 'cancel' || state === 'exception') {
    return { status: 'exception', fromOdoo: false, deliveredAt: null }
  }
  return { status: 'preparing', fromOdoo: false, deliveredAt: null }
}

describe('odoo delivery_status mapping', () => {
  it('preferisce delivery_status delivered a state done', () => {
    const mapped = mapDeliveryStatus('delivered', 'done', true)
    expect(mapped.status).toBe('delivered')
    expect(mapped.fromOdoo).toBe(true)
    expect(mapped.deliveredAt).toBe('2026-10-03T14:22:00.000Z')
  })

  it('mappa exception dal corriere', () => {
    expect(mapDeliveryStatus('exception', 'done', true).status).toBe('exception')
  })

  it('pending con tracking diventa shipped', () => {
    expect(mapDeliveryStatus('pending', 'assigned', true).status).toBe('shipped')
    expect(mapDeliveryStatus('pending', 'assigned', false).status).toBe('preparing')
  })

  it('senza delivery_status usa state magazzino', () => {
    expect(mapDeliveryStatus(null, 'done', true)).toEqual({
      status: 'shipped',
      fromOdoo: false,
      deliveredAt: null,
    })
  })
})
