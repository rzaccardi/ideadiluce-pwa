import { describe, expect, it } from 'vitest'
import type { ShippingQuoteDTO } from '@/types/dto'
import {
  filterVisibleShippingQuotes,
  isFreeShippingLocked,
  isRomePickupEligible,
  isShippingQuoteSelectable,
} from './shipping-quotes'

function quote(
  partial: Pick<ShippingQuoteDTO, 'methodRef' | 'source' | 'label'> &
    Partial<ShippingQuoteDTO>,
): ShippingQuoteDTO {
  return {
    carrierCode: 'internal',
    serviceCode: partial.source,
    amountCents: partial.amountCents ?? 0,
    currencyCode: 'EUR',
    etaDays: null,
    ...partial,
  }
}

describe('isRomePickupEligible', () => {
  it('accetta Roma / Rome con CAP 001xx', () => {
    expect(isRomePickupEligible({ city: 'Roma', postalCode: '00185', country: 'IT' })).toBe(true)
    expect(isRomePickupEligible({ city: 'Rome', postalCode: '00100', country: 'IT' })).toBe(true)
  })

  it('rifiuta fuori Roma o CAP non 001', () => {
    expect(isRomePickupEligible({ city: 'Milano', postalCode: '20100', country: 'IT' })).toBe(false)
    expect(isRomePickupEligible({ city: 'Roma', postalCode: '00042', country: 'IT' })).toBe(false)
    expect(isRomePickupEligible({ city: 'Roma', postalCode: '00185', country: 'FR' })).toBe(false)
  })
})

describe('filterVisibleShippingQuotes / free shipping lock', () => {
  const free = quote({ methodRef: 'free:1', source: 'free', label: 'Spedizione gratuita' })
  const pickup = quote({ methodRef: 'pickup:1', source: 'pickup', label: 'Ritiro' })
  const flat = quote({
    methodRef: 'flat:1',
    source: 'flat',
    label: 'Spedizione standard',
    amountCents: 590,
  })
  const fedex = quote({
    methodRef: 'fedex:1',
    source: 'fedex',
    label: 'FedEx',
    amountCents: 1220,
  })

  it('sotto soglia mostra tutte le quote (ritiro non esclusivo)', () => {
    expect(filterVisibleShippingQuotes([flat, fedex, pickup]).map((q) => q.source)).toEqual([
      'flat',
      'fedex',
      'pickup',
    ])
  })

  it('con gratuita sblocata restano solo free + pickup', () => {
    expect(filterVisibleShippingQuotes([free, flat, fedex, pickup]).map((q) => q.source)).toEqual([
      'free',
      'pickup',
    ])
  })

  it('lock consente free e pickup, non express', () => {
    expect(
      isFreeShippingLocked([free, pickup], {
        eligible: true,
        thresholdCents: 20000,
        remainingCents: 0,
        label: 'x',
      }),
    ).toBe(true)
    expect(isShippingQuoteSelectable(free, true)).toBe(true)
    expect(isShippingQuoteSelectable(pickup, true)).toBe(true)
    expect(isShippingQuoteSelectable(fedex, true)).toBe(false)
  })

  it('fuori Roma con solo free (niente pickup) la card free resta selezionabile', () => {
    const visible = filterVisibleShippingQuotes([free, flat, fedex])
    expect(visible.map((q) => q.source)).toEqual(['free'])
    expect(isShippingQuoteSelectable(visible[0]!, true)).toBe(true)
    expect(
      isFreeShippingLocked(visible, {
        eligible: true,
        thresholdCents: 20000,
        remainingCents: 0,
        label: 'x',
      }),
    ).toBe(true)
  })
})
