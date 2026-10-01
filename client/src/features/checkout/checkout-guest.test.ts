import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { authStore } from '@/features/auth'
import {
  acceptGuestCheckout,
  canAdvanceFromStep,
  isAnagraficaCompartmentComplete,
  isCheckoutAccountReady,
  isShippingBlockedByMissingPhone,
  resetCheckout,
  shouldSkipCheckoutStep,
} from './checkout.actions'
import { checkoutStore } from './checkout.store'

function completeGuestBilling() {
  checkoutStore.draft.billing = {
    ...checkoutStore.draft.billing,
    firstName: 'Mario',
    lastName: 'Rossi',
    line1: 'Via Roma',
    streetNumber: '1',
    isSnc: false,
    city: 'Roma',
    postalCode: '00100',
    province: 'RM',
    country: 'IT',
    phone: '+393331234567',
  }
}

describe('guest checkout account readiness', () => {
  beforeEach(() => {
    resetCheckout()
    authStore.me = null
    authStore.isAuthenticated = false
    authStore.error = null
    checkoutStore.draft.email = ''
    checkoutStore.guestCheckoutAccepted = false
    checkoutStore.currentStep = 'account'
    checkoutStore.error = null
  })

  afterEach(() => {
    resetCheckout()
    authStore.me = null
    authStore.isAuthenticated = false
  })

  it('non è pronto senza email né guest/auth', () => {
    expect(isCheckoutAccountReady()).toBe(false)
    expect(canAdvanceFromStep('account')).toBe(false)
  })

  it('accetta guest checkout con email valida e avanza dallo step account', () => {
    checkoutStore.draft.email = 'ospite@example.com'
    expect(acceptGuestCheckout()).toBe(true)
    expect(checkoutStore.guestCheckoutAccepted).toBe(true)
    expect(isCheckoutAccountReady()).toBe(true)
    expect(canAdvanceFromStep('account')).toBe(true)
    expect(shouldSkipCheckoutStep('account')).toBe(true)
    expect(checkoutStore.currentStep).not.toBe('account')
  })

  it('permette anagrafica completa anche da ospite (non solo auth)', () => {
    checkoutStore.draft.email = 'ospite@example.com'
    expect(acceptGuestCheckout()).toBe(true)
    completeGuestBilling()
    expect(isAnagraficaCompartmentComplete()).toBe(true)
  })

  it('dopo guest + indirizzo IT con telefono non blocca la spedizione', () => {
    checkoutStore.draft.email = 'ospite@example.com'
    expect(acceptGuestCheckout()).toBe(true)
    completeGuestBilling()
    checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
    checkoutStore.draft.billingSameAsShipping = true
    expect(isShippingBlockedByMissingPhone()).toBe(false)
  })

  it('dopo guest senza telefono blocca i metodi di spedizione', () => {
    checkoutStore.draft.email = 'ospite@example.com'
    expect(acceptGuestCheckout()).toBe(true)
    completeGuestBilling()
    checkoutStore.draft.billing.phone = ''
    checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
    expect(isShippingBlockedByMissingPhone()).toBe(true)
  })

  it('rifiuta guest checkout con email invalida', () => {
    checkoutStore.draft.email = 'not-an-email'
    expect(acceptGuestCheckout()).toBe(false)
    expect(checkoutStore.guestCheckoutAccepted).toBe(false)
    expect(isCheckoutAccountReady()).toBe(false)
  })

  it('considera pronto un utente autenticato con email', () => {
    authStore.isAuthenticated = true
    authStore.me = { id: 'u1', email: 'user@example.com' } as typeof authStore.me
    expect(isCheckoutAccountReady()).toBe(true)
    expect(canAdvanceFromStep('account')).toBe(true)
  })
})
