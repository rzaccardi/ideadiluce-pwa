/**
 * Matrice decisionale disponibilità (Sprint 1 Task 5).
 *
 * | scenario              | stock | req | saleOk | orderable | unrecoverable | status      | purchasable | restock CTA | product req CTA | checkout |
 * |-----------------------|-------|-----|--------|-----------|---------------|-------------|-------------|-------------|-----------------|----------|
 * | disponibile           | 5     | 1   | true   | true      | false         | available   | yes         | no          | no              | yes      |
 * | qty>stock ordinabile    | 2     | 5   | true   | true      | false         | orderable   | yes         | no          | no              | yes      |
 * | stock 0 ordinabile      | 0     | 1   | true   | true      | false         | orderable   | yes         | yes         | no              | yes      |
 * | esaurito non ordinabile | 0     | 1   | true   | false     | false         | out_of_stock| no          | no          | yes             | no       |
 * | fuori produzione        | 0     | 1   | false  | *         | true          | out_of_stock| no          | no          | yes             | no       |
 */
import { describe, expect, it } from 'vitest'
import {
  isProductRequestEligible,
  isRestockNotifyEligible,
  resolveVariantAvailability,
  snapshotToAvailabilityData,
} from './availability.service.js'
import type { VariantStockSnapshot } from '../../adapters/odoo/odooInventoryAdapter.js'

function snap(partial: Partial<VariantStockSnapshot>): VariantStockSnapshot {
  return {
    variantId: 1,
    stockQty: 0,
    restockDate: null,
    leadTimeDays: null,
    saleOk: true,
    orderable: true,
    ...partial,
  }
}

describe('resolveVariantAvailability', () => {
  it('stock sufficiente → available, purchasable', () => {
    const r = resolveVariantAvailability({ stockQty: 5, orderable: true }, 1)
    expect(r.state).toBe('available')
    expect(r.purchasable).toBe(true)
  })

  it('qty > stock ma ordinabile → orderable, purchasable', () => {
    const r = resolveVariantAvailability({ stockQty: 2, orderable: true }, 5)
    expect(r.state).toBe('orderable')
    expect(r.purchasable).toBe(true)
    expect(r.warning).toContain('2')
  })

  it('stock 0 ordinabile → orderable', () => {
    const r = resolveVariantAvailability({ stockQty: 0, orderable: true }, 1)
    expect(r.state).toBe('orderable')
    expect(r.purchasable).toBe(true)
  })

  it('stock 0 non ordinabile → out_of_stock', () => {
    const r = resolveVariantAvailability({ stockQty: 0, orderable: false }, 1)
    expect(r.state).toBe('out_of_stock')
    expect(r.purchasable).toBe(false)
  })

  it('sale_ok false → out_of_stock, richiesta prodotto', () => {
    const r = resolveVariantAvailability({ stockQty: 0, saleOk: false, orderable: true }, 1)
    expect(r.state).toBe('out_of_stock')
    expect(r.showRequestProduct).toBe(true)
  })
})

describe('snapshotToAvailabilityData — semantica DTO', () => {
  it('isOrderable = backorder commerciale, non canAddToCart', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 5, orderable: true }), 1)
    expect(dto.isOrderable).toBe(true)
    expect(dto.isUnrecoverable).toBe(false)
  })

  it('isUnrecoverable solo con sale_ok false', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, saleOk: false }), 1)
    expect(dto.isUnrecoverable).toBe(true)
    expect(dto.isOrderable).toBe(false)
  })

  it('esaurito non ordinabile non è unrecoverable', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, orderable: false }), 1)
    expect(dto.isUnrecoverable).toBe(false)
    expect(dto.isOrderable).toBe(false)
  })
})

describe('CTA restock / richiesta prodotto', () => {
  it('RESTOCK_NOTIFY su stock 0 ordinabile', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, orderable: true }), 1)
    expect(isRestockNotifyEligible(dto)).toBe(true)
    expect(isProductRequestEligible(dto)).toBe(false)
  })

  it('PRODUCT_REQUEST su unrecoverable', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, saleOk: false }), 1)
    expect(isProductRequestEligible(dto)).toBe(true)
    expect(isRestockNotifyEligible(dto)).toBe(false)
  })

  it('PRODUCT_REQUEST su esaurito non ordinabile', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, orderable: false }), 1)
    expect(isProductRequestEligible(dto)).toBe(true)
    expect(isRestockNotifyEligible(dto)).toBe(false)
  })

  it('nessuna CTA se disponibile', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 3, orderable: true }), 1)
    expect(isRestockNotifyEligible(dto)).toBe(false)
    expect(isProductRequestEligible(dto)).toBe(false)
  })
})
