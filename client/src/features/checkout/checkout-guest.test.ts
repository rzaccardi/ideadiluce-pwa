import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authStore } from '@/features/auth'
import {
  acceptGuestCheckout,
  applyEmailLookupResult,
  canAdvanceFromStep,
  canGoBackCheckoutStep,
  goBackCheckoutStep,
  isAnagraficaCompartmentComplete,
  isCheckoutAccountReady,
  isCheckoutCustomerSegmentVisible,
  isCheckoutFormUnlocked,
  isShippingBlockedByMissingPhone,
  resetCheckout,
  setEmailLookupLoading,
  shouldSkipCheckoutStep,
} from './checkout.actions'
import { checkoutStore } from './checkout.store'

vi.mock('@/api/endpoints', () => ({
  api: {
    checkout: {
      start: vi.fn(),
    },
  },
}))

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

function markEmailAsNewGuest(email: string) {
  checkoutStore.draft.email = email
  checkoutStore.emailLookup = {
    status: 'ready',
    email: email.toLowerCase(),
    exists: false,
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
    checkoutStore.emailLookup = { status: 'idle', email: '', exists: null }
    checkoutStore.contactForceLogin = false
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
    expect(isCheckoutFormUnlocked()).toBe(false)
    expect(isCheckoutCustomerSegmentVisible()).toBe(true)
    expect(canAdvanceFromStep('account')).toBe(false)
  })

  it('accetta guest checkout con email valida senza saltare lo step contatto', () => {
    markEmailAsNewGuest('ospite@example.com')
    expect(acceptGuestCheckout()).toBe(true)
    expect(checkoutStore.guestCheckoutAccepted).toBe(true)
    expect(isCheckoutAccountReady()).toBe(true)
    expect(isCheckoutFormUnlocked()).toBe(true)
    expect(isCheckoutCustomerSegmentVisible()).toBe(true)
    expect(canAdvanceFromStep('account')).toBe(true)
    expect(shouldSkipCheckoutStep('account')).toBe(false)
    expect(checkoutStore.currentStep).toBe('account')
  })

  it('salta lo step contatto solo se autenticato', () => {
    authStore.isAuthenticated = true
    authStore.me = { id: 'u1', email: 'user@example.com' } as typeof authStore.me
    expect(shouldSkipCheckoutStep('account')).toBe(true)
  })

  it('da indirizzi, Indietro porta al contatto anche se autenticato', () => {
    authStore.isAuthenticated = true
    authStore.me = { id: 'u1', email: 'user@example.com' } as typeof authStore.me
    checkoutStore.currentStep = 'addresses'
    expect(canGoBackCheckoutStep('addresses')).toBe(true)
    goBackCheckoutStep()
    expect(checkoutStore.currentStep).toBe('account')
    expect(checkoutStore.contactStepPinned).toBe(true)
    expect(shouldSkipCheckoutStep('account')).toBe(false)
  })

  it('applyEmailLookupResult con exists false sblocca guest silenziosamente', () => {
    checkoutStore.draft.email = 'nuovo@example.com'
    applyEmailLookupResult('nuovo@example.com', false)
    expect(checkoutStore.guestCheckoutAccepted).toBe(true)
    expect(checkoutStore.emailLookup.exists).toBe(false)
    expect(isCheckoutFormUnlocked()).toBe(true)
    expect(isCheckoutCustomerSegmentVisible()).toBe(true)
  })

  it('applyEmailLookupResult con exists true richiede login e non sblocca', () => {
    checkoutStore.draft.email = 'esistente@example.com'
    applyEmailLookupResult('esistente@example.com', true)
    expect(checkoutStore.guestCheckoutAccepted).toBe(false)
    expect(checkoutStore.emailLookup.exists).toBe(true)
    expect(isCheckoutFormUnlocked()).toBe(false)
    expect(isCheckoutCustomerSegmentVisible()).toBe(true)
    expect(acceptGuestCheckout()).toBe(false)
  })

  it('mostra Privato/Azienda anche durante lookup email in corso', () => {
    checkoutStore.draft.email = 'nuovo@example.com'
    setEmailLookupLoading('nuovo@example.com')
    expect(checkoutStore.emailLookup.status).toBe('loading')
    expect(isCheckoutFormUnlocked()).toBe(false)
    expect(isCheckoutCustomerSegmentVisible()).toBe(true)
  })

  it('permette anagrafica completa anche da ospite (non solo auth)', () => {
    markEmailAsNewGuest('ospite@example.com')
    expect(acceptGuestCheckout()).toBe(true)
    completeGuestBilling()
    expect(isAnagraficaCompartmentComplete()).toBe(true)
  })

  it('dopo guest + indirizzo IT con telefono non blocca la spedizione', () => {
    markEmailAsNewGuest('ospite@example.com')
    expect(acceptGuestCheckout()).toBe(true)
    completeGuestBilling()
    checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
    checkoutStore.draft.billingSameAsShipping = true
    expect(isShippingBlockedByMissingPhone()).toBe(false)
  })

  it('dopo guest senza telefono blocca i metodi di spedizione', () => {
    markEmailAsNewGuest('ospite@example.com')
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
    expect(isCheckoutFormUnlocked()).toBe(true)
    expect(isCheckoutCustomerSegmentVisible()).toBe(false)
    expect(canAdvanceFromStep('account')).toBe(true)
  })
})

describe('startCheckout createAccount flag', () => {
  beforeEach(() => {
    resetCheckout()
    authStore.me = null
    authStore.isAuthenticated = false
  })

  afterEach(() => {
    resetCheckout()
    authStore.me = null
    authStore.isAuthenticated = false
    vi.clearAllMocks()
  })

  it('passa createAccount: true per guest non autenticati', async () => {
    const { api } = await import('@/api/endpoints')
    const { startCheckout } = await import('./checkout.actions')
    const startMock = vi.mocked(api.checkout.start)
    startMock.mockResolvedValue({
      orderId: 'ord_1',
      amountTotal: 1000,
      currencyCode: 'EUR',
    } as Awaited<ReturnType<typeof api.checkout.start>>)

    markEmailAsNewGuest('ospite@example.com')
    acceptGuestCheckout()
    checkoutStore.draft.billing = {
      ...checkoutStore.draft.billing,
      firstName: 'Mario',
      lastName: 'Rossi',
      line1: 'Via Roma',
      streetNumber: '1',
      city: 'Roma',
      postalCode: '00100',
      province: 'RM',
      country: 'IT',
      phone: '+393331234567',
    }
    checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
    checkoutStore.selectedShippingMethodRef = 'std'
    checkoutStore.shippingSelectionPersisted = true

    await startCheckout({ silent: true })

    expect(startMock).toHaveBeenCalled()
    const body = startMock.mock.calls[0]?.[0] as { createAccount?: boolean }
    expect(body.createAccount).toBe(true)
  })
})
