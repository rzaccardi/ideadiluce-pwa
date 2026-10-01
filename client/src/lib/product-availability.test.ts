import { describe, expect, it } from 'vitest'
import {
  getProductAvailabilityStatus,
  resolveMaxOrderableQty,
} from './product-availability'

describe('getProductAvailabilityStatus — matrice requisiti', () => {
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
    expect(r.detail).toContain('24/48h')
    expect(r.detail).toContain('5')
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
})

describe('resolveMaxOrderableQty — edge case', () => {
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
})
