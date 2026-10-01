/**
 * Matrice decisionale disponibilità (fornitori / lead time).
 *
 * | S   | Fornitori | Q   | Esito |
 * |-----|-----------|-----|-------|
 * | 0   | assenti   | ≥1  | Caso 3 — out_of_stock, Avvisami |
 * | 0   | presenti  | ≥1  | Caso 2 — orderable, BASE+LT |
 * | >0  | assenti   | ≤S  | Caso 1 — available, BASE |
 * | >0  | assenti   | >S  | Edge — out_of_stock (UI cap a S) |
 * | >0  | presenti  | ≤S  | Caso 1 — available, BASE |
 * | >0  | presenti  | >S  | Caso 2 — orderable, BASE+LT |
 */
import { describe, expect, it } from 'vitest'
import {
  isProductRequestEligible,
  isRestockNotifyEligible,
  resolveCartDeliveryLeadDays,
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
    orderable: false,
    hasSuppliers: false,
    ...partial,
  }
}

describe('resolveVariantAvailability - matrice requisiti', () => {
  it('Caso 1: Q ≤ S → available, lead 0', () => {
    const r = resolveVariantAvailability({ stockQty: 5, orderable: true, leadTimeDays: 7 }, 1)
    expect(r.state).toBe('available')
    expect(r.purchasable).toBe(true)
    expect(r.effectiveLeadDays).toBe(0)
  })

  it('Caso 1 con fornitori e Q ≤ S → available (non orderable)', () => {
    const r = resolveVariantAvailability({ stockQty: 4, orderable: true, leadTimeDays: 5 }, 4)
    expect(r.state).toBe('available')
    expect(r.effectiveLeadDays).toBe(0)
  })

  it('Caso 2: Q > S con fornitori → orderable, lead = LT', () => {
    const r = resolveVariantAvailability(
      { stockQty: 2, orderable: true, leadTimeDays: 5 },
      5,
    )
    expect(r.state).toBe('orderable')
    expect(r.purchasable).toBe(true)
    expect(r.effectiveLeadDays).toBe(5)
    expect(r.warning).toBeNull()
  })

  it('Caso 2: S = 0 con fornitori → orderable', () => {
    const r = resolveVariantAvailability(
      { stockQty: 0, orderable: true, leadTimeDays: 10 },
      1,
    )
    expect(r.state).toBe('orderable')
    expect(r.purchasable).toBe(true)
    expect(r.effectiveLeadDays).toBe(10)
  })

  it('Caso 2: LT 0 con fornitori → orderable, lead 0 (solo BASE)', () => {
    const r = resolveVariantAvailability({ stockQty: 0, orderable: true, leadTimeDays: 0 }, 1)
    expect(r.state).toBe('orderable')
    expect(r.effectiveLeadDays).toBe(0)
  })

  it('Caso 3: S = 0 senza fornitori → out_of_stock, non purchasable', () => {
    const r = resolveVariantAvailability({ stockQty: 0, orderable: false }, 1)
    expect(r.state).toBe('out_of_stock')
    expect(r.purchasable).toBe(false)
    expect(r.showRequestProduct).toBe(false)
  })

  it('Edge: Q > S senza fornitori, S > 0 → out_of_stock', () => {
    const r = resolveVariantAvailability({ stockQty: 4, orderable: false }, 5)
    expect(r.state).toBe('out_of_stock')
    expect(r.purchasable).toBe(false)
    expect(r.warning).toContain('4')
  })

  it('sale_ok false → out_of_stock, richiesta prodotto', () => {
    const r = resolveVariantAvailability({ stockQty: 0, saleOk: false, orderable: true }, 1)
    expect(r.state).toBe('out_of_stock')
    expect(r.showRequestProduct).toBe(true)
  })

  it('orderable undefined → non backorder (conservativo)', () => {
    const r = resolveVariantAvailability({ stockQty: 0 }, 1)
    expect(r.state).toBe('out_of_stock')
    expect(r.purchasable).toBe(false)
  })
})

describe('snapshotToAvailabilityData - semantica DTO', () => {
  it('isOrderable = ha fornitori', () => {
    const dto = snapshotToAvailabilityData(
      snap({ stockQty: 5, orderable: true, hasSuppliers: true, leadTimeDays: 3 }),
      1,
    )
    expect(dto.isOrderable).toBe(true)
    expect(dto.isUnrecoverable).toBe(false)
    expect(dto.customerLeadTimeDays).toBe(3)
  })

  it('isUnrecoverable solo con sale_ok false', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, saleOk: false }), 1)
    expect(dto.isUnrecoverable).toBe(true)
    expect(dto.isOrderable).toBe(false)
  })

  it('esaurito senza fornitori non è unrecoverable', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, orderable: false }), 1)
    expect(dto.isUnrecoverable).toBe(false)
    expect(dto.isOrderable).toBe(false)
  })
})

describe('CTA restock / richiesta prodotto', () => {
  it('Avvisami su Caso 3 (stock 0, nessun fornitore)', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, orderable: false }), 1)
    expect(isRestockNotifyEligible(dto)).toBe(true)
    expect(isProductRequestEligible(dto)).toBe(false)
  })

  it('nessun Avvisami su Caso 2 (stock 0 con fornitori)', () => {
    const dto = snapshotToAvailabilityData(
      snap({ stockQty: 0, orderable: true, hasSuppliers: true, leadTimeDays: 5 }),
      1,
    )
    expect(isRestockNotifyEligible(dto)).toBe(false)
    expect(isProductRequestEligible(dto)).toBe(false)
  })

  it('PRODUCT_REQUEST solo su unrecoverable', () => {
    const dto = snapshotToAvailabilityData(snap({ stockQty: 0, saleOk: false }), 1)
    expect(isProductRequestEligible(dto)).toBe(true)
    expect(isRestockNotifyEligible(dto)).toBe(false)
  })

  it('nessuna CTA se disponibile', () => {
    const dto = snapshotToAvailabilityData(
      snap({ stockQty: 3, orderable: true, hasSuppliers: true }),
      1,
    )
    expect(isRestockNotifyEligible(dto)).toBe(false)
    expect(isProductRequestEligible(dto)).toBe(false)
  })
})

describe('resolveCartDeliveryLeadDays - tempo peggiore', () => {
  it('max tra righe miste Caso 1 + Caso 2', () => {
    const days = resolveCartDeliveryLeadDays([
      { purchasable: true, effectiveLeadDays: null },
      { purchasable: true, effectiveLeadDays: 5 },
      { purchasable: true, effectiveLeadDays: 12 },
      { purchasable: false, effectiveLeadDays: 99 },
    ])
    expect(days).toBe(12)
  })

  it('null se tutte le righe sono Caso 1 (lead 0)', () => {
    expect(
      resolveCartDeliveryLeadDays([
        { purchasable: true, effectiveLeadDays: null },
        { purchasable: true, effectiveLeadDays: 0 },
      ]),
    ).toBeNull()
  })
})
