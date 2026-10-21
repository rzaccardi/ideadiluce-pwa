import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { authStore } from '@/features/auth'
import {
  getCheckoutBillingAddress,
  isShippingBlockedByMissingPhone,
  prefillCheckoutFromAuthUser,
  resetCheckout,
  setBillingSameAsShipping,
  updateCheckoutAddress,
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

  it('è false se la spedizione ha telefono anche senza phone in fatturazione', () => {
    checkoutStore.draft.billing = readyAddress({ phone: '' })
    checkoutStore.draft.shipping = readyAddress({ phone: '+393331234567' })
    checkoutStore.draft.billingSameAsShipping = false
    expect(isShippingBlockedByMissingPhone()).toBe(false)
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
    expect(checkoutStore.draft.billingSameAsShipping).toBe(true)
    expect(checkoutStore.draft.billing.phone).toBe('+393339998877')
    expect(checkoutStore.draft.shipping.phone).toBe('+393339998877')
    expect(isShippingBlockedByMissingPhone()).toBe(false)
  })

  it('da loggato billingSameAsShipping resta true e il payload billing segue shipping', () => {
    authStore.isAuthenticated = true
    authStore.me = { id: 'u1', email: 'user@example.com' } as typeof authStore.me
    checkoutStore.deliveryRecipient.mode = 'self'
    checkoutStore.draft.billingSameAsShipping = true
    checkoutStore.draft.billing = readyAddress({
      line1: 'Vecchia Via',
      city: 'Milano',
      postalCode: '20100',
      province: 'MI',
      phone: '+393331234567',
    })
    checkoutStore.draft.shipping = readyAddress({
      line1: 'Via Nuova',
      city: 'Roma',
      postalCode: '00100',
      province: 'RM',
      phone: '+393339998877',
    })

    setBillingSameAsShipping(false)
    expect(checkoutStore.draft.billingSameAsShipping).toBe(true)

    updateCheckoutAddress('shipping', 'line1', 'Via Aggiornata')
    const billing = getCheckoutBillingAddress()
    expect(billing.line1).toBe('Via Aggiornata')
    expect(billing.city).toBe('Roma')
    expect(billing.phone).toBe('+393339998877')
  })

  it('sblocca se telefono solo sul profilo e destinazione già pronta', () => {
    authStore.isAuthenticated = true
    authStore.me = {
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Mario',
      lastName: 'Rossi',
      phone: '+393331112233',
      shippingAddress: null,
    } as typeof authStore.me

    checkoutStore.draft.billing = readyAddress({ phone: '' })
    checkoutStore.draft.shipping = readyAddress({ phone: '' })
    expect(isShippingBlockedByMissingPhone()).toBe(false)
    expect(checkoutStore.draft.shipping.phone).toBe('+393331112233')
    expect(checkoutStore.draft.billing.phone).toBe('+393331112233')
  })
})
