import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { authStore } from '@/features/auth'
import {
  isShippingBlockedByMissingPhone,
  prefillCheckoutFromAuthUser,
  resetCheckout,
} from './checkout.actions'
import { checkoutStore } from './checkout.store'

function readyAddress(overrides: Partial<typeof checkoutStore.draft.billing> = {}) {
  return {
    firstName: 'Mario',
    lastName: 'Rossi',
    line1: 'Via Roma',
    streetNumber: '1',
    isSnc: false,
    line2: '',
    city: 'Roma',
    postalCode: '00100',
    province: 'RM',
    country: 'IT',
    phone: '',
    courierNotes: '',
    ...overrides,
  }
}

describe('isShippingBlockedByMissingPhone', () => {
  beforeEach(() => {
    resetCheckout()
    authStore.me = null
    authStore.isAuthenticated = false
  })

  afterEach(() => {
    resetCheckout()
    authStore.me = null
    authStore.isAuthenticated = false
  })

  it('è true se destinazione pronta senza telefono', () => {
    checkoutStore.draft.billing = readyAddress()
    checkoutStore.draft.shipping = readyAddress()
    checkoutStore.draft.billingSameAsShipping = true
    expect(isShippingBlockedByMissingPhone()).toBe(true)
  })

  it('è true se manca il telefono in fatturazione anche con phone sulla spedizione', () => {
    checkoutStore.draft.billing = readyAddress({ phone: '' })
    checkoutStore.draft.shipping = readyAddress({ phone: '+393331234567' })
    checkoutStore.draft.billingSameAsShipping = false
    expect(isShippingBlockedByMissingPhone()).toBe(true)
  })

  it('è false con telefono valido su billing e shipping', () => {
    const withPhone = readyAddress({ phone: '+393331234567' })
    checkoutStore.draft.billing = withPhone
    checkoutStore.draft.shipping = { ...withPhone }
    expect(isShippingBlockedByMissingPhone()).toBe(false)
  })

  it('è false se l’indirizzo non è ancora completo', () => {
    checkoutStore.draft.billing = readyAddress({ line1: '', phone: '' })
    checkoutStore.draft.shipping = readyAddress({ line1: '', phone: '' })
    expect(isShippingBlockedByMissingPhone()).toBe(false)
  })

  it('prefill copia il telefono shipping sul billing se manca', () => {
    authStore.isAuthenticated = true
    authStore.me = {
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Mario',
      lastName: 'Rossi',
      phone: '',
      shippingAddress: {
        firstName: 'Mario',
        lastName: 'Rossi',
        line1: 'Via Roma',
        streetNumber: '1',
        city: 'Roma',
        postalCode: '00100',
        province: 'RM',
        country: 'IT',
        phone: '+393339998877',
      },
    } as typeof authStore.me

    prefillCheckoutFromAuthUser()
    expect(checkoutStore.draft.billing.phone).toBe('+393339998877')
    expect(checkoutStore.draft.shipping.phone).toBe('+393339998877')
    expect(isShippingBlockedByMissingPhone()).toBe(false)
  })
})
