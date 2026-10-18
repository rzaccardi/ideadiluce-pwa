import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getProductAvailabilityStatus,
  resolveMaxOrderableQty,
} from './product-availability'

describe('getProductAvailabilityStatus - matrice requisiti', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 18, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('Caso 1: Q ≤ S → Disponibile + BASE', () => {
    const r = getProductAvailabilityStatus({
      availability: { qtyAvailable: 7, isOrderable: false },
      requestedQty: 2,
      locale: 'IT',
    })
    expect(r.status).toBe('available')
    expect(r.label).toBe('Disponibile')
    expect(r.detail).toContain('24/48h')
    expect(r.canAddToCart).toBe(true)
    expect(r.showRestockNotify).toBe(false)
  })

  it('non mostra la quantità esatta di stock', () => {
    const r = getProductAvailabilityStatus({
      availability: { qtyAvailable: 3, isOrderable: false },
      requestedQty: 1,
      locale: 'IT',
    })
    expect(r.label).not.toMatch(/\d/)
  })

  it('Caso 2: Q > S con fornitori → BASE + LT', () => {
    const r = getProductAvailabilityStatus({
      availability: {
        qtyAvailable: 2,
        isOrderable: true,
        customerLeadTimeDays: 5,
      },
      requestedQty: 4,
      locale: 'IT',
    })
    expect(r.status).toBe('orderable')
    expect(r.canAddToCart).toBe(true)
    expect(r.detail).toBe('Spedito indicativamente entro il 23 ottobre 2026')
    expect(r.leadTimeDays).toBe(5)
  })

  it('Caso 2: S = 0 con fornitori → ordinabile', () => {
    const r = getProductAvailabilityStatus({
      availability: {
        qtyAvailable: 0,
        isOrderable: true,
        customerLeadTimeDays: 8,
      },
      requestedQty: 1,
      locale: 'IT',
    })
    expect(r.status).toBe('orderable')
    expect(r.canAddToCart).toBe(true)
    expect(r.showRestockNotify).toBe(false)
  })

  it('Caso 3: S = 0 senza fornitori → Avvisami', () => {
    const r = getProductAvailabilityStatus({
      availability: { qtyAvailable: 0, isOrderable: false },
      requestedQty: 1,
      locale: 'IT',
    })
    expect(r.status).toBe('out_of_stock')
    expect(r.canAddToCart).toBe(false)
    expect(r.showRestockNotify).toBe(true)
    expect(r.showProductRequest).toBe(false)
  })

  it('fuori produzione → Richiedi prodotto', () => {
    const r = getProductAvailabilityStatus({
      availability: { qtyAvailable: 0, isOrderable: false, isUnrecoverable: true },
      requestedQty: 1,
      locale: 'IT',
    })
    expect(r.showProductRequest).toBe(true)
    expect(r.showRestockNotify).toBe(false)
  })

  it('is_storable false → sempre Disponibile + BASE', () => {
    const r = getProductAvailabilityStatus({
      availability: { qtyAvailable: 0, isOrderable: false, isStorable: false },
      requestedQty: 5,
      locale: 'IT',
    })
    expect(r.status).toBe('available')
    expect(r.detail).toContain('24/48h')
    expect(r.canAddToCart).toBe(true)
    expect(r.showRestockNotify).toBe(false)
  })

  it('7871: Q=10 BASE; Q=20 BASE+2 giorni', () => {
    const q10 = getProductAvailabilityStatus({
      availability: {
        qtyAvailable: 16,
        isOrderable: true,
        customerLeadTimeDays: 2,
      },
      requestedQty: 10,
      locale: 'IT',
    })
    expect(q10.status).toBe('available')
    expect(q10.detail).toContain('24/48h')
    expect(q10.detail).not.toMatch(/\+\s*2/)

    const q20 = getProductAvailabilityStatus({
      availability: {
        qtyAvailable: 16,
        isOrderable: true,
        customerLeadTimeDays: 2,
      },
      requestedQty: 20,
      locale: 'IT',
    })
    expect(q20.status).toBe('orderable')
    expect(q20.detail).toBe('Spedito indicativamente entro il 20 ottobre 2026')
  })

  it('Caso 2: LT 0 → solo BASE', () => {
    const r = getProductAvailabilityStatus({
      availability: {
        qtyAvailable: 0,
        isOrderable: true,
        customerLeadTimeDays: 0,
      },
      requestedQty: 1,
      locale: 'IT',
    })
    expect(r.status).toBe('orderable')
    expect(r.detail).toContain('24/48h')
    expect(r.detail).not.toMatch(/\+\s*\d/)
  })

  it('Edge: Q > S senza fornitori → non acquistabile (UI cap a S)', () => {
    const r = getProductAvailabilityStatus({
      availability: { qtyAvailable: 4, isOrderable: false },
      requestedQty: 5,
      locale: 'IT',
    })
    expect(r.status).toBe('out_of_stock')
    expect(r.canAddToCart).toBe(false)
    expect(r.showRestockNotify).toBe(false)
  })
})

describe('resolveMaxOrderableQty - edge case', () => {
  it('cap a S quando non ci sono fornitori', () => {
    expect(
      resolveMaxOrderableQty({ qtyAvailable: 4, isOrderable: false }),
    ).toBe(4)
  })

  it('nessun cap quando ci sono fornitori', () => {
    expect(
      resolveMaxOrderableQty({ qtyAvailable: 4, isOrderable: true }),
    ).toBeUndefined()
  })

  it('nessun cap quando S = 0', () => {
    expect(
      resolveMaxOrderableQty({ qtyAvailable: 0, isOrderable: false }),
    ).toBeUndefined()
  })

  it('nessun cap per non storable', () => {
    expect(
      resolveMaxOrderableQty({ qtyAvailable: 0, isOrderable: false, isStorable: false }),
    ).toBeUndefined()
  })
})
