import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { t, type MessageKey } from '@/i18n/messages'
import { parseLocaleFromPathname } from '@/lib/locale'
import {
  CHECKOUT_STEP_ORDER,
  checkoutStore,
  emptyCheckoutAddress,
  type CheckoutStep,
  type CheckoutPaymentMethodDTO,
  type CustomerSegmentChoice,
  type DeliveryRecipientMode,
} from './checkout.store'
import { authStore } from '@/features/auth'
import type {
  CartDTO,
  CustomerSegmentDTO,
  ShippingQuoteDTO,
  TaxValidationResultDTO,
  ThankYouOrderDTO,
  UserDTO,
} from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import type { ResolvedAddress } from '@/lib/addressAutocomplete'
import {
  hasPrefilledAddress,
  refreshAddressAutocompleteStatus,
  resolvePrefilledAddress,
} from '@/lib/addressAutocomplete'
import { shippingAddressFromUser } from '@/lib/address'
import { isCheckoutAddressValid } from '@/lib/checkout-address.validators'
import { fetchCart } from '@/features/cart'
import { cartStore } from '@/features/cart/cart.store'
import {
  filterVisibleShippingQuotes,
  isFreeShippingLocked,
  isFreeShippingQuote,
  isShippingQuoteSelectable,
} from './shipping-quotes'
import { checkoutDbg } from './checkout-debug'

function currentLocale() {
  if (typeof window === 'undefined') return 'IT' as const
  return parseLocaleFromPathname(window.location.pathname)
}

function localeMessage(key: MessageKey) {
  return t(currentLocale(), key)
}

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : localeMessage('checkout.error.generic')
}

function shippingAddressPayload() {
  const dropship = dropshipPayload()
  if (dropship) return { ...dropship }
  return { ...checkoutStore.draft.shipping }
}

function billingAddressPayload() {
  return { ...checkoutStore.draft.billing }
}

function shippingAddressForQuotes() {
  const base = shippingAddressPayload()
  return {
    ...base,
    firstName: base.firstName.trim() || 'Cliente',
    lastName: base.lastName.trim() || 'Checkout',
  }
}

function destinationComplete(address: AddressInput) {
  return Boolean(
    address.line1.trim() &&
      address.city.trim() &&
      address.postalCode.trim() &&
      address.country.trim() &&
      (address.isSnc || address.streetNumber.trim()),
  )
}

function shippingFingerprint(address: AddressInput) {
  return [address.line1, address.streetNumber, address.isSnc ? 'snc' : '', address.city, address.postalCode, address.country]
    .map((v) => String(v).trim().toLowerCase())
    .join('|')
}

let shippingQuotesDebounce: ReturnType<typeof setTimeout> | null = null
let taxRecalcDebounce: ReturnType<typeof setTimeout> | null = null
let checkoutPaymentPrefetchPromise: Promise<void> | null = null
let checkoutPaymentPrefetchKey: string | null = null
let checkoutTransitionPrefetchPromise: Promise<void> | null = null
let checkoutTransitionPrefetchKey: string | null = null
let checkoutTransitionPrefetchCompletedKey: string | null = null

function invalidateCheckoutTransitionPrefetch() {
  checkoutTransitionPrefetchCompletedKey = null
  checkoutTransitionPrefetchKey = null
  checkoutTransitionPrefetchPromise = null
  checkoutStore.transitionToPaymentLoading = false
}

function checkoutTransitionPrefetchFingerprint(): string {
  const recipient = checkoutStore.deliveryRecipient
  return [
    checkoutStore.selectedShippingMethodRef ?? '',
    checkoutStore.selectedPaymentMethod,
    checkoutStore.draft.email,
    checkoutStore.draft.billingSameAsShipping ? 'same' : 'diff',
    recipient.mode ?? 'self',
    shippingFingerprint(shippingAddressPayload()),
    shippingFingerprint(billingAddressPayload()),
    checkoutStore.clientOrderRef.trim(),
    checkoutStore.business.vatNumber.trim(),
    checkoutStore.business.fiscalCode.trim(),
    checkoutStore.business.companyName.trim(),
  ].join('|')
}

function canPrefetchCheckoutTransition(): boolean {
  if (!authStore.isAuthenticated) return false
  if (isFrozenQuoteCheckout()) return false
  if (checkoutStore.cartRefreshing || checkoutStore.shippingSelectingRef) return false
  return canAdvanceFromStep('addresses')
}

async function syncCheckoutBeforePaymentStep() {
  syncCheckoutContactFromProfile()
  syncShippingDestinationFromBillingIfNeeded()
  syncShippingContactFromBillingIfNeeded()
  syncShippingFromDeliveryRecipient()
  await validateTaxFields()
  if (checkoutStore.shippingQuotes.length === 0 && canFetchShippingQuotes()) {
    await fetchShippingQuotes()
  }
  if (!isSpedizioneCompartmentComplete()) {
    throw new Error(localeMessage('checkout.error.incompleteStep'))
  }
  await syncCheckoutDraft('details', { silent: true })
  await syncCheckoutDraft('shipping', { silent: true })
}

async function ensureCheckoutOrderAndPaymentSession() {
  if (!checkoutStore.order?.orderId) {
    await startCheckout({ silent: true })
  }
  if (
    checkoutStore.selectedPaymentMethod === 'stripe' &&
    (!checkoutStore.payment?.clientSecret ||
      checkoutStore.payment.method !== checkoutStore.selectedPaymentMethod)
  ) {
    await createPaymentSession({ silent: true })
  }
}

/** Precarica sync indirizzi + ordine + sessione pagamento dopo la scelta spedizione. */
export function prefetchCheckoutTransitionToPayment(): void {
  if (!canPrefetchCheckoutTransition()) return

  const key = checkoutTransitionPrefetchFingerprint()
  if (checkoutTransitionPrefetchCompletedKey === key) return
  if (checkoutTransitionPrefetchPromise && checkoutTransitionPrefetchKey === key) return

  checkoutTransitionPrefetchKey = key
  checkoutDbg.fn('prefetchCheckoutTransitionToPayment', 'enter', { key })
  checkoutStore.transitionToPaymentLoading = true

  checkoutTransitionPrefetchPromise = (async () => {
    try {
      await syncCheckoutBeforePaymentStep()
      await ensureCheckoutOrderAndPaymentSession()
      checkoutTransitionPrefetchCompletedKey = key
      checkoutDbg.fn('prefetchCheckoutTransitionToPayment', 'exit', {
        orderId: checkoutStore.order?.orderId,
        hasClientSecret: Boolean(checkoutStore.payment?.clientSecret),
      })
    } catch (e) {
      checkoutTransitionPrefetchCompletedKey = null
      checkoutDbg.fn('prefetchCheckoutTransitionToPayment', 'error', { message: errMessage(e) })
    } finally {
      checkoutStore.transitionToPaymentLoading = false
      if (checkoutTransitionPrefetchKey === key) {
        checkoutTransitionPrefetchPromise = null
      }
    }
  })()
}

export function awaitCheckoutTransitionPrefetch(): Promise<void> {
  return checkoutTransitionPrefetchPromise ?? Promise.resolve()
}

function checkoutNetCents(): number {
  const cart = cartStore.cart
  if (!cart) return 0
  if (cart.taxBreakdown?.netCents != null) return cart.taxBreakdown.netCents
  if (cart.estimatedSubtotal != null) return cart.estimatedSubtotal
  return cart.items.reduce((s, i) => s + (i.lineTotalEstimateCents ?? 0), 0)
}

function applyCartShippingTotals(amountCents: number) {
  const cart = cartStore.cart
  if (!cart) return
  const subtotal =
    cart.estimatedSubtotal ?? cart.items.reduce((s, i) => s + (i.lineTotalEstimateCents ?? 0), 0)
  const tax = cart.estimatedTax ?? cart.taxBreakdown?.taxCents ?? 0
  cartStore.cart = {
    ...cart,
    estimatedShipping: amountCents,
    estimatedTotal: subtotal + tax + amountCents,
  }
}

function scheduleTaxRecalculate(delayMs = 450) {
  if (taxRecalcDebounce) clearTimeout(taxRecalcDebounce)
  const ship = shippingAddressPayload()
  if (!destinationComplete(ship)) {
    checkoutDbg.fn('scheduleTaxRecalculate', 'skip', { reason: 'destination incomplete' })
    return
  }
  checkoutDbg.schedule('scheduleTaxRecalculate', delayMs, { fingerprint: shippingFingerprint(ship) })
  taxRecalcDebounce = setTimeout(() => {
    taxRecalcDebounce = null
    void refreshTaxBreakdown()
  }, delayMs)
}

export async function refreshTaxBreakdown() {
  checkoutDbg.fn('refreshTaxBreakdown', 'enter', { step: checkoutStore.currentStep })
  const ship = shippingAddressPayload()
  const bill = billingAddressPayload()
  if (!destinationComplete(ship)) {
    checkoutStore.taxBreakdown = null
    checkoutDbg.fn('refreshTaxBreakdown', 'skip', { reason: 'destination incomplete' })
    return
  }
  checkoutStore.taxCalculating = true
  try {
    const segment = effectiveCustomerSegment()
    checkoutDbg.api('tax.calculate', { netCents: checkoutNetCents(), segment })
    checkoutStore.taxBreakdown = await api.tax.calculate({
      netCents: checkoutNetCents(),
      billingCountry: bill.country,
      shippingCountry: ship.country,
      customerSegment: segment ?? 'retail',
      isProfessional: authStore.me?.customerSegment === 'professional',
      vatValidated: checkoutStore.business.vatValidated || undefined,
      vatForceAccepted: checkoutStore.business.vatForceAccepted || undefined,
    })
    checkoutDbg.fn('refreshTaxBreakdown', 'exit', { taxCents: checkoutStore.taxBreakdown?.taxCents })
  } catch (e) {
    checkoutStore.taxBreakdown = null
    checkoutDbg.fn('refreshTaxBreakdown', 'error', { message: errMessage(e) })
  } finally {
    checkoutStore.taxCalculating = false
  }
}

function applyViesAutofill(res: TaxValidationResultDTO) {
  const autofill = res.vat?.autofill
  if (!autofill) return

  if (autofill.companyName && !checkoutStore.business.companyName.trim()) {
    checkoutStore.business.companyName = autofill.companyName
  }

  const billing = checkoutStore.draft.billing
  if (autofill.billingLine1 && !billing.line1.trim()) {
    billing.line1 = autofill.billingLine1
  }
  if (autofill.billingLine2 && !billing.line2?.trim()) {
    billing.line2 = autofill.billingLine2
  }
  if (autofill.billingCity && !billing.city.trim()) {
    billing.city = autofill.billingCity
  }
  if (autofill.billingPostalCode && !billing.postalCode.trim()) {
    billing.postalCode = autofill.billingPostalCode
  }
}

function applyTaxValidationResult(res: TaxValidationResultDTO) {
  if (res.fiscalCode) {
    checkoutStore.business.fiscalCodeValid = res.fiscalCode.valid
    checkoutStore.business.fiscalCodeError = res.fiscalCode.valid
      ? null
      : (res.fiscalCode.errors[0] ?? null)
  } else if (!checkoutStore.business.fiscalCode.trim()) {
    checkoutStore.business.fiscalCodeValid = null
    checkoutStore.business.fiscalCodeError = null
  }

  if (res.vat) {
    checkoutStore.business.vatFormatValid = res.vat.formatValid
    checkoutStore.business.vatChecksumValid = res.vat.checksumValid
    checkoutStore.business.viesStatus = res.vat.vies.status
    checkoutStore.business.viesAddress = res.vat.vies.address
    checkoutStore.business.viesRequestDate = res.vat.vies.requestDate

    const formatOk = res.vat.formatValid && res.vat.checksumValid
    checkoutStore.business.vatError = formatOk ? null : (res.vat.errors[0] ?? null)

    const viesCompanyName = res.vat.autofill?.companyName ?? res.vat.vies.name
    if (viesCompanyName?.trim()) {
      checkoutStore.business.vatCompanyName = viesCompanyName
    }

    if (res.vat.vies.status === 'valid') {
      checkoutStore.business.vatValidated = true
      applyViesAutofill(res)
    } else if (res.vat.vies.status === 'invalid' && res.vat.countryCode !== 'IT') {
      checkoutStore.business.vatValidated = false
    } else if (
      res.vat.vies.status === 'service_unavailable' ||
      (res.vat.vies.status === 'invalid' && res.vat.countryCode === 'IT')
    ) {
      if (res.vat.formatValid && res.vat.checksumValid) {
        applyViesAutofill(res)
      }
    }
    scheduleTaxRecalculate(0)
  } else if (!checkoutStore.business.vatNumber.trim()) {
    checkoutStore.business.vatFormatValid = null
    checkoutStore.business.vatChecksumValid = null
    checkoutStore.business.vatError = null
    checkoutStore.business.viesStatus = null
    checkoutStore.business.viesAddress = null
    checkoutStore.business.viesRequestDate = null
  }
}

/** Dati fiscali invariati rispetto al profilo BE già verificato — niente re-validazione API. */
function taxFieldsTrustedFromAuth(): boolean {
  const user = authStore.me
  if (!user || !checkoutStore.anagraficaCollectedAtAccount) return false

  const b = checkoutStore.business
  if (isBusinessCheckout()) {
    return (
      b.companyName.trim() === (user.companyName?.trim() ?? '') &&
      b.vatNumber.trim() === (user.vatNumber?.trim() ?? '') &&
      b.pec.trim() === (user.pec?.trim() ?? '') &&
      b.sdiCode.trim() === (user.sdiCode?.trim() ?? '')
    )
  }

  return b.fiscalCode.trim() === (user.fiscalCode?.trim() ?? '')
}

function syncAnagraficaCollectedFromAuthProfile() {
  if (!authStore.isAuthenticated) return
  if (isAnagraficaCompartmentComplete()) {
    checkoutStore.anagraficaCollectedAtAccount = true
  }
}

export async function validateTaxFields() {
  if (taxFieldsTrustedFromAuth()) {
    applyUserTaxProfileToCheckout(authStore.me!)
    return null
  }

  const country = billingAddressPayload().country.toUpperCase()
  const fiscalCode = checkoutStore.business.fiscalCode.trim()
  const vatNumber = checkoutStore.business.vatNumber.trim()
  const business = isBusinessCheckout()

  if (!fiscalCode && !vatNumber) {
    checkoutStore.business.fiscalCodeValid = null
    checkoutStore.business.fiscalCodeError = null
    checkoutStore.business.vatFormatValid = null
    checkoutStore.business.vatChecksumValid = null
    checkoutStore.business.vatError = null
    checkoutStore.business.viesStatus = null
    return null
  }

  checkoutStore.business.taxValidating = true
  if (fiscalCode) checkoutStore.business.fiscalCodeError = null
  if (vatNumber) checkoutStore.business.vatError = null
  try {
    const res = await api.tax.validate({
      countryCode: country,
      fiscalCode: fiscalCode || undefined,
      vatNumber: vatNumber || undefined,
      personType: business ? 'company' : 'private',
    })
    applyTaxValidationResult(res)
    return res
  } catch (e) {
    const msg = errMessage(e)
    if (fiscalCode) checkoutStore.business.fiscalCodeError = msg
    if (vatNumber) checkoutStore.business.vatError = msg
    throw e
  } finally {
    checkoutStore.business.taxValidating = false
  }
}

export async function validateCheckoutVat() {
  checkoutStore.business.vatError = null
  try {
    const res = await api.vat.validate({
      vatNumber: checkoutStore.business.vatNumber.trim(),
      countryCode: billingAddressPayload().country,
    })
    checkoutStore.business.vatValidated = res.valid
    checkoutStore.business.vatForceAccepted = res.vatForceAccepted
    checkoutStore.business.vatAttempts = res.attempts
    checkoutStore.business.vatCompanyName = res.companyName ?? null
    checkoutStore.business.viesStatus = res.valid
      ? 'valid'
      : res.vatForceAccepted
        ? checkoutStore.business.viesStatus
        : 'invalid'
    if (res.valid) {
      checkoutStore.business.vatError = null
    }
    scheduleTaxRecalculate(0)
    return res
  } catch (e) {
    if (e instanceof ApiRequestError) {
      const details = e.details as { attempts?: number } | undefined
      if (details?.attempts != null) checkoutStore.business.vatAttempts = details.attempts
      checkoutStore.business.vatValidated = false
    }
    checkoutStore.business.vatError = errMessage(e)
    throw e
  }
}

export function updateBusinessVatNumber(value: string) {
  checkoutStore.business.vatNumber = value
  checkoutStore.business.vatValidated = false
  checkoutStore.business.vatForceAccepted = false
  checkoutStore.business.vatCompanyName = null
  checkoutStore.business.vatFormatValid = null
  checkoutStore.business.vatChecksumValid = null
  checkoutStore.business.vatError = null
  checkoutStore.business.viesStatus = null
  scheduleTaxRecalculate()
}

export function updateBusinessCompanyName(value: string) {
  checkoutStore.business.companyName = value
}

function invalidateShippingIfDestinationChanged() {
  const current = shippingFingerprint(shippingAddressPayload())
  const cached = checkoutStore.shippingQuotesFingerprint
  if (cached && cached !== current) {
    checkoutDbg.state('invalidateShippingIfDestinationChanged', { cached, current })
    checkoutStore.shippingQuotes = []
    checkoutStore.freeShippingHint = null
    checkoutStore.selectedShippingMethodRef = null
    checkoutStore.shippingSelectionPersisted = false
  }
}

function scheduleShippingQuotesFetch(delayMs = 450) {
  if (checkoutStore.initLoadingPhase) {
    checkoutDbg.fn('scheduleShippingQuotesFetch', 'skip', { reason: 'initLoadingPhase' })
    return
  }
  if (checkoutStore.addressPrefillLoading) {
    checkoutDbg.fn('scheduleShippingQuotesFetch', 'skip', { reason: 'addressPrefillLoading' })
    return
  }
  if (shippingQuotesDebounce) clearTimeout(shippingQuotesDebounce)

  const addr = shippingAddressPayload()
  if (!destinationComplete(addr)) {
    shippingQuotesDebounce = null
    checkoutDbg.fn('scheduleShippingQuotesFetch', 'skip', { reason: 'destination incomplete' })
    return
  }

  checkoutDbg.schedule('scheduleShippingQuotesFetch', delayMs, { fingerprint: shippingFingerprint(addr) })
  shippingQuotesDebounce = setTimeout(() => {
    shippingQuotesDebounce = null
    void refreshShippingQuotesIfNeeded()
  }, delayMs)
}

async function refreshShippingQuotesIfNeeded() {
  checkoutDbg.fn('refreshShippingQuotesIfNeeded', 'enter')
  const addr = shippingAddressPayload()
  if (!destinationComplete(addr)) {
    checkoutDbg.fn('refreshShippingQuotesIfNeeded', 'skip', { reason: 'destination incomplete' })
    return
  }

  const fp = shippingFingerprint(addr)
  if (
    checkoutStore.shippingQuotesFingerprint === fp &&
    checkoutStore.shippingQuotes.length > 0
  ) {
    checkoutDbg.fn('refreshShippingQuotesIfNeeded', 'skip', { reason: 'cached fingerprint', fp })
    return
  }

  if (checkoutStore.shippingQuotesLoading) {
    checkoutDbg.fn('refreshShippingQuotesIfNeeded', 'skip', { reason: 'already loading, reschedule' })
    scheduleShippingQuotesFetch(300)
    return
  }

  try {
    await fetchShippingQuotes()
    checkoutDbg.fn('refreshShippingQuotesIfNeeded', 'exit', { quotes: checkoutStore.shippingQuotes.length })
  } catch (e) {
    checkoutDbg.fn('refreshShippingQuotesIfNeeded', 'error', { message: errMessage(e) })
  }
}

function addressComplete(address: AddressInput) {
  return isCheckoutAddressValid(address)
}

function isCheckoutEmailValid(email: string): boolean {
  const trimmed = email.trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export function resolveCheckoutEmail(): string {
  const fromDraft = checkoutStore.draft.email.trim()
  if (fromDraft) return fromDraft
  return authStore.me?.email?.trim() ?? ''
}

function ensureCheckoutEmailInDraft(): string {
  const email = resolveCheckoutEmail()
  if (email && !checkoutStore.draft.email.trim()) {
    checkoutStore.draft.email = email
  }
  return email
}

/** true se nome e cognome sono già nel profilo o nell'indirizzo salvato. */
export function hasCheckoutContactFromProfile(): boolean {
  const user = authStore.me
  if (!user) return false
  const firstName = user.firstName?.trim() || user.shippingAddress?.firstName?.trim() || ''
  const lastName = user.lastName?.trim() || user.shippingAddress?.lastName?.trim() || ''
  return Boolean(firstName && lastName)
}

function syncCheckoutContactFromProfile() {
  const user = authStore.me
  const bill = checkoutStore.draft.billing
  const ship = checkoutStore.draft.shipping
  const profileFirst = user?.firstName?.trim() || user?.shippingAddress?.firstName?.trim() || ''
  const profileLast = user?.lastName?.trim() || user?.shippingAddress?.lastName?.trim() || ''

  if (!bill.firstName.trim() && profileFirst) bill.firstName = profileFirst
  if (!bill.lastName.trim() && profileLast) bill.lastName = profileLast
  if (!ship.firstName.trim()) ship.firstName = bill.firstName.trim() || profileFirst
  if (!ship.lastName.trim()) ship.lastName = bill.lastName.trim() || profileLast
}

function syncShippingContactFromBillingIfNeeded() {
  const ship = checkoutStore.draft.shipping
  const bill = checkoutStore.draft.billing
  if (!ship.firstName.trim() && bill.firstName.trim()) ship.firstName = bill.firstName
  if (!ship.lastName.trim() && bill.lastName.trim()) ship.lastName = bill.lastName
  if (!(ship.phone ?? '').trim() && (bill.phone ?? '').trim()) ship.phone = bill.phone
}

function syncShippingDestinationFromBillingIfNeeded() {
  if ((checkoutStore.deliveryRecipient.mode ?? 'self') === 'other') return
  if (!checkoutStore.draft.billingSameAsShipping) return
  const bill = checkoutStore.draft.billing
  const ship = checkoutStore.draft.shipping
  checkoutStore.draft.shipping = {
    ...bill,
    courierNotes: ship.courierNotes?.trim() ? ship.courierNotes : bill.courierNotes,
  }
}

export function isAnagraficaCompartmentComplete(): boolean {
  if (!authStore.isAuthenticated) return false
  if (effectiveCustomerSegment() == null) return false
  if (!isCheckoutEmailValid(resolveCheckoutEmail())) return false
  return addressComplete(checkoutStore.draft.billing) && businessBillingComplete()
}

function isDeliveryRecipientComplete(): boolean {
  const mode = checkoutStore.deliveryRecipient.mode ?? 'self'
  if (mode === 'self') return addressComplete(checkoutStore.draft.shipping)
  if (mode === 'other') {
    const addr = dropshipPayload()
    return Boolean(addr && addressComplete(addr))
  }
  return false
}

export function isSpedizioneCompartmentComplete(): boolean {
  if (!isAnagraficaCompartmentComplete()) return false
  if (!isDeliveryRecipientComplete()) return false
  return Boolean(checkoutStore.selectedShippingMethodRef && checkoutStore.shippingSelectionPersisted)
}

function segmentFromAuth(): CustomerSegmentChoice {
  const seg = authStore.me?.customerSegment
  if (seg === 'retail' || seg === 'business') return seg
  if (seg === 'professional') return 'business'
  return null
}

export function effectiveCustomerSegment(): CustomerSegmentChoice {
  return checkoutStore.customerSegment ?? segmentFromAuth()
}

export function isBusinessCheckout(): boolean {
  if (authStore.me?.isProfessional || authStore.me?.customerSegment === 'professional') {
    return true
  }
  const seg = effectiveCustomerSegment()
  return seg === 'business'
}

/** Validazione dati fiscali/azienda (registrazione checkout o step fatturazione). */
export function isBusinessAnagraficaComplete(): boolean {
  return businessBillingComplete()
}

function businessBillingComplete(): boolean {
  const country = checkoutStore.draft.billing.country.toUpperCase()
  const b = checkoutStore.business

  if (!isBusinessCheckout()) {
    const fc = b.fiscalCode.trim()
    if (country === 'IT') {
      if (!fc) return true
      return b.fiscalCodeValid === true
    }
    return true
  }

  if (!b.companyName.trim() || !b.vatNumber.trim()) return false
  if (country === 'IT' && !b.pec.trim() && !b.sdiCode.trim()) return false

  if (country === 'IT') {
    return b.vatChecksumValid === true
  }

  const isEuNonIt = country !== 'IT' && /^[A-Z]{2}$/.test(country)
  if (isEuNonIt) {
    if (b.vatFormatValid === false || b.vatChecksumValid === false) return false
    if (b.vatValidated || b.vatForceAccepted) return true
    if (b.viesStatus === 'service_unavailable') return true
    if (b.viesStatus === 'valid') return true
    return false
  }

  return true
}

function dropshipPayload() {
  const mode = checkoutStore.deliveryRecipient.mode ?? 'self'
  if (mode !== 'other') return undefined
  const addr = checkoutStore.dropshipAddress
  const meta = checkoutStore.deliveryRecipient
  return {
    ...addr,
    firstName: meta.firstName.trim() || addr.firstName,
    lastName: meta.lastName.trim() || addr.lastName,
    phone: meta.phone.trim() || addr.phone,
  }
}

export function isFrozenQuoteCheckout() {
  return checkoutStore.checkoutMode === 'frozen_quote'
}

export function cartFromFrozenQuoteSummary(detail: ThankYouOrderDTO): CartDTO {
  const items = detail.lines.map((line, index) => ({
    id: `frozen-${index}`,
    productRef: line.productRef,
    variantRef: line.variantRef,
    quantity: line.quantity,
    clientUnitPriceEstimateCents: line.unitPriceCents,
    lineTotalEstimateCents: line.lineTotalCents,
    productSlug: line.productSlug,
    productName: line.productName,
    imageUrl: line.imageUrl,
    purchasable: true,
    availabilityStatus: 'available' as const,
    availability: {
      state: 'available' as const,
      stockQty: line.quantity,
      effectiveLeadDays: null,
      warning: null,
    },
  }))
  return {
    id: detail.cartId,
    currencyCode: detail.currencyCode,
    status: 'ACTIVE',
    items,
    estimatedSubtotal: detail.subtotalCents,
    estimatedTax: detail.taxCents,
    estimatedShipping: detail.shippingCents,
    estimatedTotal: detail.amountTotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    purchasableItemCount: items.length,
    warnings: [],
    deliveryLeadDays: null,
    deliveryEstimateDays: null,
    repricedAt: null,
    reservation: {
      enabled: false,
      startedAt: null,
      expiresAt: null,
      expiresInSeconds: null,
      elapsedSeconds: null,
      expired: false,
      ttlMinutes: 0,
    },
    taxBreakdown: checkoutStore.taxBreakdown,
  }
}

export function shouldSkipCheckoutStep(step: CheckoutStep): boolean {
  if (step === 'billing' || step === 'shipping') return true
  if (step === 'delivery_recipient' || step === 'shipping_method') return true
  if (isFrozenQuoteCheckout()) {
    return step !== 'payment' && step !== 'review'
  }
  if (step === 'account' && authStore.isAuthenticated) return true
  if (step === 'customer_type' && effectiveCustomerSegment() != null) return true
  return false
}

function stepIndex(step: CheckoutStep) {
  return CHECKOUT_STEP_ORDER.indexOf(step)
}

export function getNextCheckoutStep(from: CheckoutStep): CheckoutStep | null {
  let idx = stepIndex(from)
  if (idx < 0) return null
  while (idx < CHECKOUT_STEP_ORDER.length - 1) {
    idx += 1
    const next = CHECKOUT_STEP_ORDER[idx]!
    if (!shouldSkipCheckoutStep(next)) return next
  }
  return null
}

export function getPreviousCheckoutStep(from: CheckoutStep): CheckoutStep | null {
  let idx = stepIndex(from)
  if (idx <= 0) return null
  while (idx > 0) {
    idx -= 1
    const prev = CHECKOUT_STEP_ORDER[idx]!
    if (!shouldSkipCheckoutStep(prev)) return prev
  }
  return null
}

export function resolveInitialCheckoutStep(): CheckoutStep {
  if (!authStore.isAuthenticated) return 'account'
  const segment = segmentFromAuth()
  if (segment) checkoutStore.customerSegment = segment
  return getNextCheckoutStep('account') ?? 'addresses'
}

/** Dati fiscali dal profilo BE: già verificati, niente pulsante «Verifica» manuale. */
function applyUserTaxProfileToCheckout(user: UserDTO) {
  if (user.fiscalCode?.trim()) {
    checkoutStore.business.fiscalCode = user.fiscalCode
    checkoutStore.business.fiscalCodeValid = user.fiscalCodeValid ?? true
    checkoutStore.business.fiscalCodeError = null
  }

  if (user.vatNumber?.trim()) {
    checkoutStore.business.vatNumber = user.vatNumber
    checkoutStore.business.vatFormatValid = user.vatFormatValid ?? true
    checkoutStore.business.vatChecksumValid = user.vatChecksumValid ?? true
    checkoutStore.business.vatError = null

    if (user.viesValid === true) {
      checkoutStore.business.vatValidated = true
      checkoutStore.business.viesStatus = 'valid'
    } else if (user.viesValid === false) {
      checkoutStore.business.vatValidated = false
      checkoutStore.business.viesStatus = 'invalid'
    }

    if (user.viesName) checkoutStore.business.vatCompanyName = user.viesName
    if (user.viesAddress) checkoutStore.business.viesAddress = user.viesAddress
    if (user.taxCheckedAt) checkoutStore.business.viesRequestDate = user.taxCheckedAt
  }
}

export function prefillCheckoutFromAuthUser() {
  const user = authStore.me
  if (!user) return
  if (user.email) checkoutStore.draft.email = user.email
  const segment = segmentFromAuth()
  if (segment) checkoutStore.customerSegment = segment
  if (user.companyName) checkoutStore.business.companyName = user.companyName
  applyUserTaxProfileToCheckout(user)
  if (user.pec) checkoutStore.business.pec = user.pec
  if (user.sdiCode) checkoutStore.business.sdiCode = user.sdiCode

  const shipAddr = shippingAddressFromUser(user)
  checkoutStore.draft.shipping = { ...checkoutStore.draft.shipping, ...shipAddr }

  const billing = checkoutStore.draft.billing
  if (shipAddr.line1.trim()) {
    billing.line1 = shipAddr.line1
    billing.streetNumber = shipAddr.streetNumber
    billing.isSnc = shipAddr.isSnc
    billing.line2 = shipAddr.line2
    billing.city = shipAddr.city
    billing.postalCode = shipAddr.postalCode
    billing.country = shipAddr.country
  }
  if (shipAddr.firstName.trim()) billing.firstName = shipAddr.firstName
  if (shipAddr.lastName.trim()) billing.lastName = shipAddr.lastName

  syncCheckoutContactFromProfile()
  syncAnagraficaCollectedFromAuthProfile()
  initShippingFromBilling()
}

export function setCheckoutStep(step: CheckoutStep) {
  checkoutDbg.state('setCheckoutStep', { from: checkoutStore.currentStep, to: step })
  checkoutStore.currentStep = normalizeCheckoutStep(step)
}

function normalizeCheckoutStep(step: CheckoutStep): CheckoutStep {
  if (step === 'billing' || step === 'shipping' || step === 'details') return 'addresses'
  if (step === 'payment_method') return 'payment'
  return step
}

let addressPrefillPromise: Promise<void> | null = null

async function resolvePrefilledCheckoutAddressesFromAuth() {
  const shipping = checkoutStore.draft.shipping
  if (hasPrefilledAddress(shipping)) {
    const resolved = await resolvePrefilledAddress(shipping)
    if (resolved) await applyResolvedAddress('shipping', resolved)
  }

  if (!checkoutStore.draft.billingSameAsShipping) {
    const billing = checkoutStore.draft.billing
    if (hasPrefilledAddress(billing)) {
      const resolved = await resolvePrefilledAddress(billing)
      if (resolved) await applyResolvedAddress('billing', resolved)
    }
  }
}

async function runAddressPrefillInit() {
  checkoutDbg.fn('runAddressPrefillInit', 'enter')
  checkoutStore.initLoadingPhase = 'anagrafica'

  try {
    prefillCheckoutFromAuthUser()
    syncAnagraficaCollectedFromAuthProfile()

    const shipping = checkoutStore.draft.shipping
    const billing = checkoutStore.draft.billing
    const needsGeocode =
      hasPrefilledAddress(shipping) ||
      (!checkoutStore.draft.billingSameAsShipping && hasPrefilledAddress(billing))

    if (needsGeocode) {
      checkoutStore.initLoadingPhase = 'indirizzi'
      await refreshAddressAutocompleteStatus()
      await resolvePrefilledCheckoutAddressesFromAuth()
    }

    if (destinationComplete(shippingAddressPayload())) {
      checkoutStore.initLoadingPhase = 'spedizioni'
      try {
        initShippingFromBilling()
        await fetchShippingQuotes()
      } catch {
        /* errore già in checkoutStore.error */
      }
    }
  } finally {
    checkoutStore.initLoadingPhase = null
    checkoutStore.addressPrefillLoading = false
    syncAnagraficaCollectedFromAuthProfile()
    checkoutStore.currentStep = resolveInitialCheckoutStep()
    checkoutDbg.fn('runAddressPrefillInit', 'exit', { step: checkoutStore.currentStep })
  }
}

export function initializeCheckoutNavigation(): Promise<void> {
  checkoutDbg.fn('initializeCheckoutNavigation', 'enter', {
    authenticated: authStore.isAuthenticated,
    hasPrefillPromise: Boolean(addressPrefillPromise),
  })
  if (!authStore.isAuthenticated) {
    checkoutStore.currentStep = 'account'
    checkoutStore.addressPrefillLoading = false
    checkoutStore.initLoadingPhase = null
    checkoutDbg.fn('initializeCheckoutNavigation', 'skip', { reason: 'not authenticated' })
    return Promise.resolve()
  }

  if (addressPrefillPromise) {
    checkoutDbg.fn('initializeCheckoutNavigation', 'skip', { reason: 'prefill already running' })
    return addressPrefillPromise
  }

  addressPrefillPromise = runAddressPrefillInit().finally(() => {
    addressPrefillPromise = null
  })
  return addressPrefillPromise
}

/** Dopo login/registrazione: precompila, geocodifica e poi avanza allo step indirizzo. */
export async function prepareCheckoutAfterAuth() {
  await initializeCheckoutNavigation()
}

/** Dopo modifica righe carrello: azzera pagamento e spedizione già calcolati. */
function clearCheckoutPricingState() {
  checkoutStore.payment = null
  checkoutStore.order = null
  checkoutStore.shippingQuotes = []
  checkoutStore.freeShippingHint = null
  checkoutStore.shippingQuotesFingerprint = null
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingSelectionPersisted = false
  checkoutStore.taxBreakdown = null
  checkoutPaymentPrefetchKey = null
  invalidateCheckoutTransitionPrefetch()
}

function checkoutStepNeedsShippingRefresh(step: CheckoutStep): boolean {
  return step !== 'account' && step !== 'customer_type' && step !== 'billing' && step !== 'shipping'
}

let checkoutCartRefreshPromise: Promise<void> | null = null

export function invalidateCheckoutAfterCartChange() {
  checkoutDbg.fn('invalidateCheckoutAfterCartChange', 'enter', { step: checkoutStore.currentStep })
  clearCheckoutPricingState()
  if (
    checkoutStepNeedsShippingRefresh(checkoutStore.currentStep) &&
    destinationComplete(shippingAddressPayload())
  ) {
    scheduleShippingQuotesFetch(0)
    scheduleTaxRecalculate(0)
  }
}

/** Aggiorna carrello in checkout senza cambiare step; overlay a pagina intera e pagamento bloccato. */
export async function refreshCheckoutAfterCartChange() {
  if (checkoutCartRefreshPromise) {
    checkoutDbg.fn('refreshCheckoutAfterCartChange', 'skip', { reason: 'already running' })
    return checkoutCartRefreshPromise
  }

  const step = checkoutStore.currentStep
  const previousShippingRef = checkoutStore.selectedShippingMethodRef
  checkoutDbg.fn('refreshCheckoutAfterCartChange', 'enter', { step, previousShippingRef })

  checkoutCartRefreshPromise = (async () => {
    checkoutStore.cartRefreshing = true
    checkoutStore.error = null
    clearCheckoutPricingState()

    try {
      checkoutDbg.api('fetchCart', { force: true, reprice: true })
      await fetchCart({ force: true, reprice: true, silent: true })

      if (
        checkoutStepNeedsShippingRefresh(step) &&
        destinationComplete(shippingAddressPayload())
      ) {
        await fetchShippingQuotes({ skipAutoSelect: true })
        const preferredRef =
          previousShippingRef &&
          checkoutStore.shippingQuotes.some((quote) => quote.methodRef === previousShippingRef)
            ? previousShippingRef
            : null
        if (preferredRef) {
          await selectShippingMethod(preferredRef, { silent: true })
        } else {
          await autoSelectShippingQuote(checkoutStore.shippingQuotes)
        }
        await syncCheckoutDraft('shipping', { silent: true })
      } else if (destinationComplete(shippingAddressPayload())) {
        await refreshTaxBreakdown()
      }

      if (
        (step === 'payment' || step === 'review') &&
        canStartCheckout() &&
        checkoutStore.selectedPaymentMethod
      ) {
        if (!checkoutStore.order) await startCheckout({ silent: true })
        if (!checkoutStore.payment) await createPaymentSession({ silent: true })
      }
    } catch (e) {
      checkoutStore.error = errMessage(e)
      checkoutDbg.fn('refreshCheckoutAfterCartChange', 'error', { message: checkoutStore.error })
    } finally {
      checkoutStore.cartRefreshing = false
      checkoutCartRefreshPromise = null
      checkoutDbg.fn('refreshCheckoutAfterCartChange', 'exit', { step })
    }
  })()

  return checkoutCartRefreshPromise
}

export function resetCheckout(options?: { legacyLayout?: boolean }) {
  checkoutDbg.fn('resetCheckout', 'enter', { legacyLayout: options?.legacyLayout })
  if (shippingQuotesDebounce) clearTimeout(shippingQuotesDebounce)
  if (taxRecalcDebounce) clearTimeout(taxRecalcDebounce)
  shippingQuotesDebounce = null
  taxRecalcDebounce = null
  checkoutStore.order = null
  checkoutStore.payment = null
  checkoutStore.result = null
  checkoutStore.error = null
  checkoutStore.isPaying = false
  checkoutStore.addressPrefillLoading = false
  checkoutStore.transitionToPaymentLoading = false
  checkoutStore.initLoadingPhase = null
  checkoutStore.cartRefreshing = false
  checkoutStore.selectedPaymentMethod = 'stripe'
  checkoutStore.shippingQuotes = []
  checkoutStore.freeShippingHint = null
  checkoutStore.shippingQuotesFingerprint = null
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingSelectionPersisted = false
  checkoutStore.shippingQuotesLoading = false
  checkoutStore.shippingSelectingRef = null
  checkoutStore.customerSegment = null
  checkoutStore.taxBreakdown = null
  checkoutStore.taxCalculating = false
  checkoutStore.business = {
    companyName: '',
    vatNumber: '',
    fiscalCode: '',
    pec: '',
    sdiCode: '',
    vatValidated: false,
    vatForceAccepted: false,
    vatAttempts: 0,
    vatCompanyName: null,
    viesAddress: null,
    viesRequestDate: null,
    fiscalCodeValid: null,
    fiscalCodeError: null,
    vatFormatValid: null,
    vatChecksumValid: null,
    vatError: null,
    viesStatus: null,
    taxValidating: false,
  }
  checkoutStore.clientOrderRef = ''
  checkoutStore.dropshipAddress = emptyCheckoutAddress()
  checkoutStore.deliveryRecipient = {
    mode: 'self',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  }
  checkoutStore.termsAccepted = false
  checkoutStore.anagraficaCollectedAtAccount = false
  checkoutStore.checkoutMode = 'standard'
  checkoutStore.frozenOrderSummary = null
  invalidateCheckoutTransitionPrefetch()
  checkoutStore.draft = {
    email: '',
    orderNotes: '',
    billingSameAsShipping: true,
    billing: emptyCheckoutAddress(),
    shipping: emptyCheckoutAddress(),
  }
  if (options?.legacyLayout) {
    checkoutStore.currentStep = 'details'
  } else {
    void initializeCheckoutNavigation()
  }
}

/** Dopo logout nel checkout: torna guest mantenendo indirizzi già compilati. */
export function clearCheckoutAfterLogout() {
  checkoutStore.draft.email = ''
  checkoutStore.customerSegment = null
  checkoutStore.payment = null
  checkoutStore.order = null
  checkoutStore.result = null
  checkoutStore.error = null
  checkoutStore.isPaying = false
  checkoutStore.isLoading = false
  checkoutStore.addressPrefillLoading = false
  checkoutStore.transitionToPaymentLoading = false
  checkoutStore.initLoadingPhase = null
  checkoutStore.cartRefreshing = false
  checkoutStore.shippingSelectionPersisted = false
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingQuotes = []
  checkoutStore.shippingQuotesFingerprint = null
  checkoutStore.shippingQuotesLoading = false
  checkoutStore.shippingSelectingRef = null
  checkoutStore.freeShippingHint = null
  checkoutStore.taxBreakdown = null
  checkoutStore.taxCalculating = false
  checkoutStore.clientOrderRef = ''
  checkoutStore.anagraficaCollectedAtAccount = false
  checkoutStore.termsAccepted = false
  invalidateCheckoutTransitionPrefetch()
  checkoutStore.deliveryRecipient = {
    mode: 'self',
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  }
  checkoutStore.business = {
    companyName: '',
    vatNumber: '',
    fiscalCode: '',
    pec: '',
    sdiCode: '',
    vatValidated: false,
    vatForceAccepted: false,
    vatAttempts: 0,
    vatCompanyName: null,
    viesAddress: null,
    viesRequestDate: null,
    fiscalCodeValid: null,
    fiscalCodeError: null,
    vatFormatValid: null,
    vatChecksumValid: null,
    vatError: null,
    viesStatus: null,
    taxValidating: false,
  }
  checkoutStore.currentStep = 'account'
}

export function setPaymentMethod(method: CheckoutPaymentMethodDTO) {
  checkoutDbg.state('setPaymentMethod', { from: checkoutStore.selectedPaymentMethod, to: method })
  checkoutStore.selectedPaymentMethod = method
  if (method === 'stripe') prefetchCheckoutPayment()
}

export function setCustomerSegment(segment: CustomerSegmentChoice) {
  checkoutStore.customerSegment = segment
}

export function markAnagraficaCollectedAtAccount() {
  checkoutStore.anagraficaCollectedAtAccount = true
}

export function setDeliveryRecipientMode(mode: DeliveryRecipientMode) {
  checkoutStore.deliveryRecipient.mode = mode
  if (mode === 'other') {
    checkoutStore.draft.billingSameAsShipping = false
    invalidateShippingIfDestinationChanged()
    scheduleShippingQuotesFetch(0)
    return
  }
  initShippingFromBilling()
}

export function updateDeliveryRecipientField(
  key: 'firstName' | 'lastName' | 'company' | 'phone',
  value: string,
) {
  checkoutStore.deliveryRecipient[key] = value
}

export function updateDropshipAddress<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
  checkoutStore.dropshipAddress[key] = value as never
  if ((checkoutStore.deliveryRecipient.mode ?? 'self') === 'other') {
    invalidateShippingIfDestinationChanged()
    scheduleShippingQuotesFetch()
  }
}

export function updateBusinessField(
  key: 'companyName' | 'vatNumber' | 'fiscalCode' | 'pec' | 'sdiCode',
  value: string,
) {
  checkoutStore.business[key] = value
  checkoutStore.anagraficaCollectedAtAccount = false
  if (key === 'vatNumber') {
    checkoutStore.business.vatValidated = false
    checkoutStore.business.vatForceAccepted = false
    checkoutStore.business.vatCompanyName = null
    checkoutStore.business.viesAddress = null
    checkoutStore.business.viesRequestDate = null
    checkoutStore.business.vatFormatValid = null
    checkoutStore.business.vatChecksumValid = null
    checkoutStore.business.vatError = null
    checkoutStore.business.viesStatus = null
    scheduleTaxRecalculate()
  }
  if (key === 'fiscalCode') {
    checkoutStore.business.fiscalCodeValid = null
    checkoutStore.business.fiscalCodeError = null
  }
}

export function updateClientOrderRef(value: string) {
  checkoutStore.clientOrderRef = value
}

export function setTermsAccepted(value: boolean) {
  checkoutStore.termsAccepted = value
}

export function updateCheckoutEmail(email: string) {
  checkoutStore.draft.email = email
}

export function updateCheckoutOrderNotes(notes: string) {
  checkoutStore.draft.orderNotes = notes
}

type AddressKey = keyof AddressInput

export function updateCheckoutAddress<K extends AddressKey>(
  kind: 'billing' | 'shipping',
  key: K,
  value: AddressInput[K],
) {
  checkoutStore.draft[kind][key] = value
  if (kind === 'billing') {
    syncShippingDestinationFromBillingIfNeeded()
    if (destinationComplete(shippingAddressPayload())) {
      scheduleShippingQuotesFetch()
    }
  }
  invalidateShippingIfDestinationChanged()
  if (kind === 'shipping') {
    scheduleShippingQuotesFetch()
  }
  if (kind === 'shipping' || kind === 'billing') {
    scheduleTaxRecalculate()
  }
}

export function setCheckoutAddressFields(
  kind: 'billing' | 'shipping',
  fields: Partial<AddressInput>,
  options?: { skipInvalidation?: boolean },
) {
  const target = checkoutStore.draft[kind]
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue
    ;(target as Record<string, unknown>)[key] = value
  }
  if (kind === 'billing' && checkoutStore.draft.billingSameAsShipping) {
    syncShippingDestinationFromBillingIfNeeded()
  }
  if (!options?.skipInvalidation) {
    invalidateShippingIfDestinationChanged()
  }
  if (kind === 'shipping') {
    scheduleShippingQuotesFetch(options?.skipInvalidation ? 0 : 450)
  } else if (
    kind === 'billing' &&
    checkoutStore.draft.billingSameAsShipping &&
    destinationComplete(shippingAddressPayload())
  ) {
    scheduleShippingQuotesFetch(options?.skipInvalidation ? 0 : 450)
  }
  checkoutDbg.fn('setCheckoutAddressFields', 'state', { kind, fields: Object.keys(fields) })
}

export async function applyResolvedAddress(kind: 'billing' | 'shipping', resolved: ResolvedAddress) {
  setCheckoutAddressFields(
    kind,
    {
      line1: resolved.line1,
      streetNumber: resolved.streetNumber ?? '',
      isSnc: false,
      line2: resolved.line2 ?? '',
      city: resolved.city,
      postalCode: resolved.postalCode,
      country: resolved.country,
    },
    { skipInvalidation: true },
  )

  checkoutStore.shippingQuotes = []
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingSelectionPersisted = false
  checkoutStore.shippingQuotesFingerprint = null

  if (kind === 'shipping') {
    scheduleShippingQuotesFetch(0)
  }
  if (kind === 'billing') {
    syncShippingDestinationFromBillingIfNeeded()
    if (destinationComplete(shippingAddressPayload())) {
      scheduleShippingQuotesFetch(0)
    }
  }
}

export function setBillingSameAsShipping(value: boolean) {
  checkoutStore.draft.billingSameAsShipping = value
  if (value) checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
  invalidateShippingIfDestinationChanged()
  if (value && destinationComplete(shippingAddressPayload())) {
    scheduleShippingQuotesFetch(0)
  }
}

/** Retail: spedizione separata da fatturazione (default = stesso indirizzo). */
export function setShipToDifferentAddress(different: boolean) {
  setBillingSameAsShipping(!different)
}

/** Imposta spedizione = fatturazione di default (destinatario «self»). */
export function initShippingFromBilling() {
  if ((checkoutStore.deliveryRecipient.mode ?? 'self') === 'other') {
    checkoutStore.draft.billingSameAsShipping = false
    return
  }

  const bill = checkoutStore.draft.billing
  const ship = checkoutStore.draft.shipping
  checkoutStore.draft.billingSameAsShipping = true
  checkoutStore.draft.shipping = {
    ...bill,
    courierNotes: ship.courierNotes?.trim() ? ship.courierNotes : bill.courierNotes,
  }
  if (destinationComplete(shippingAddressPayload())) {
    scheduleShippingQuotesFetch(0)
  }
}

/** @deprecated usa initShippingFromBilling */
export function initRetailShippingFromBilling() {
  initShippingFromBilling()
}

/** @deprecated usa setBillingSameAsShipping */
export function setSameAsBilling(value: boolean) {
  setBillingSameAsShipping(value)
}

export function canFetchShippingQuotes() {
  return destinationComplete(shippingAddressPayload())
}

export function canAdvanceFromStep(step: CheckoutStep): boolean {
  if (checkoutStore.cartRefreshing) return false
  switch (step) {
    case 'account':
      return authStore.isAuthenticated && isCheckoutEmailValid(resolveCheckoutEmail())
    case 'customer_type':
      return effectiveCustomerSegment() != null
    case 'addresses':
    case 'billing': {
      return (
        addressComplete(checkoutStore.draft.billing) &&
        businessBillingComplete() &&
        isDeliveryRecipientComplete() &&
        Boolean(checkoutStore.selectedShippingMethodRef) &&
        checkoutStore.shippingSelectionPersisted
      )
    }
    case 'delivery_recipient': {
      const mode = checkoutStore.deliveryRecipient.mode ?? 'self'
      if (mode === 'self') {
        return addressComplete(checkoutStore.draft.shipping)
      }
      if (mode === 'other') {
        const addr = dropshipPayload()
        return Boolean(addr && addressComplete(addr))
      }
      return false
    }
    case 'shipping_method':
      return Boolean(checkoutStore.selectedShippingMethodRef) && checkoutStore.shippingSelectionPersisted
    case 'payment':
      return Boolean(checkoutStore.selectedPaymentMethod)
    case 'review':
      return checkoutStore.termsAccepted && canStartCheckout()
    default:
      return false
  }
}

export function canStartCheckout() {
  if (checkoutStore.cartRefreshing) return false
  if (isFrozenQuoteCheckout()) {
    return Boolean(checkoutStore.order?.orderId) && Boolean(checkoutStore.selectedPaymentMethod)
  }
  return (
    authStore.isAuthenticated &&
    isCheckoutEmailValid(resolveCheckoutEmail()) &&
    addressComplete(checkoutStore.draft.shipping) &&
    addressComplete(billingAddressPayload()) &&
    Boolean(checkoutStore.selectedShippingMethodRef) &&
    checkoutStore.shippingSelectionPersisted
  )
}

export function freeShippingSelectionLocked() {
  return isFreeShippingLocked(checkoutStore.shippingQuotes, checkoutStore.freeShippingHint)
}

async function autoSelectShippingQuote(quotes: ShippingQuoteDTO[]) {
  const freeQuote = quotes.find(isFreeShippingQuote)
  if (freeQuote) {
    await selectShippingMethod(freeQuote.methodRef, { silent: true })
    return
  }

  const selectedRef = checkoutStore.selectedShippingMethodRef
  if (selectedRef && !quotes.some((q) => q.methodRef === selectedRef)) {
    checkoutStore.selectedShippingMethodRef = null
    checkoutStore.shippingSelectionPersisted = false
    checkoutStore.order = null
    checkoutStore.payment = null
  }

  if (quotes.length === 1) {
    await selectShippingMethod(quotes[0]!.methodRef, { silent: true })
  }
}

function syncShippingFromDeliveryRecipient() {
  const mode = checkoutStore.deliveryRecipient.mode ?? 'self'
  if (mode === 'other') {
    const dropship = dropshipPayload()
    if (dropship) checkoutStore.draft.shipping = { ...dropship }
  }
}

export async function advanceCheckoutStep() {
  const step = checkoutStore.currentStep
  checkoutDbg.fn('advanceCheckoutStep', 'enter', { step })

  if (step !== 'addresses' && step !== 'billing' && !canAdvanceFromStep(step)) {
    checkoutStore.error = localeMessage('checkout.error.incompleteStep')
    checkoutDbg.fn('advanceCheckoutStep', 'skip', { reason: 'incomplete step', step })
    return
  }

  checkoutStore.error = null
  checkoutStore.isLoading = true

  try {
    if (step === 'addresses' || step === 'billing') {
      ensureCheckoutEmailInDraft()
      if (!canAdvanceFromStep('addresses')) {
        checkoutStore.error = localeMessage('checkout.error.incompleteStep')
        return
      }
      if (!isAnagraficaCompartmentComplete()) {
        checkoutStore.error = localeMessage('checkout.error.incompleteStep')
        return
      }
      if (!isSpedizioneCompartmentComplete()) {
        checkoutStore.error = localeMessage('checkout.selectShipping')
        return
      }

      prefetchCheckoutTransitionToPayment()
      await awaitCheckoutTransitionPrefetch()

      const transitionKey = checkoutTransitionPrefetchFingerprint()
      const prefetchReady =
        checkoutTransitionPrefetchCompletedKey === transitionKey &&
        Boolean(checkoutStore.order?.orderId)

      if (!prefetchReady) {
        await syncCheckoutBeforePaymentStep()
        await ensureCheckoutOrderAndPaymentSession()
        checkoutTransitionPrefetchCompletedKey = transitionKey
      }
    }

    if (step === 'delivery_recipient') {
      syncShippingFromDeliveryRecipient()
      await fetchShippingQuotes()
    }

    const next = getNextCheckoutStep(step === 'billing' ? 'addresses' : step)
    if (!next) return

    if (step === 'shipping_method') {
      if (!isSpedizioneCompartmentComplete()) {
        checkoutStore.error = localeMessage('checkout.error.incompleteStep')
        return
      }
      await syncCheckoutDraft('shipping', { silent: true })
    }

    if (next === 'review') {
      if (!isSpedizioneCompartmentComplete() || !canAdvanceFromStep('payment')) {
        checkoutStore.error = localeMessage('checkout.error.incompleteStep')
        return
      }
      await syncCheckoutDraft('lock', { silent: true })
    }

    checkoutStore.currentStep = next

    if (next === 'shipping_method' && checkoutStore.shippingQuotes.length === 0 && canFetchShippingQuotes()) {
      await fetchShippingQuotes()
    }

    checkoutDbg.fn('advanceCheckoutStep', 'exit', { from: step, to: next })
  } catch (e) {
    checkoutDbg.fn('advanceCheckoutStep', 'error', { message: errMessage(e) })
  } finally {
    checkoutStore.isLoading = false
  }
}

export function goBackCheckoutStep() {
  checkoutStore.error = null
  const step = checkoutStore.currentStep

  if (step === 'payment' || step === 'review') {
    checkoutStore.order = null
    checkoutStore.payment = null
  }

  const prev = getPreviousCheckoutStep(step)
  if (prev) checkoutStore.currentStep = prev
}

export function canGoBackCheckoutStep(step: CheckoutStep = checkoutStore.currentStep): boolean {
  return getPreviousCheckoutStep(step) != null
}

export async function fetchShippingQuotes(options?: { skipAutoSelect?: boolean }) {
  checkoutDbg.fn('fetchShippingQuotes', 'enter', { skipAutoSelect: options?.skipAutoSelect })
  checkoutStore.shippingQuotesLoading = true
  checkoutStore.error = null
  try {
    checkoutDbg.api('shipping.quotes', { fingerprint: shippingFingerprint(shippingAddressPayload()) })
    const res = await api.shipping.quotes({
      shippingAddress: shippingAddressForQuotes(),
    })
    checkoutStore.freeShippingHint = res.freeShippingHint
    checkoutStore.deliveryEstimateDays = res.deliveryEstimateDays ?? null
    checkoutStore.shippingQuotes = filterVisibleShippingQuotes(res.quotes, res.freeShippingHint)
    checkoutStore.shippingQuotesFingerprint = shippingFingerprint(shippingAddressPayload())
    if (!options?.skipAutoSelect) {
      await autoSelectShippingQuote(checkoutStore.shippingQuotes)
    }
    checkoutDbg.fn('fetchShippingQuotes', 'exit', {
      quotes: checkoutStore.shippingQuotes.length,
      selected: checkoutStore.selectedShippingMethodRef,
    })
  } catch (e) {
    checkoutStore.error = errMessage(e)
    checkoutDbg.fn('fetchShippingQuotes', 'error', { message: checkoutStore.error })
    throw e
  } finally {
    checkoutStore.shippingQuotesLoading = false
  }
}

export async function selectShippingMethod(methodRef: string, options?: { silent?: boolean }) {
  checkoutDbg.fn('selectShippingMethod', 'enter', { methodRef, silent: options?.silent })
  if (checkoutStore.shippingSelectingRef != null) {
    checkoutDbg.fn('selectShippingMethod', 'skip', { reason: 'already selecting', active: checkoutStore.shippingSelectingRef })
    return
  }

  if (freeShippingSelectionLocked()) {
    const quote = checkoutStore.shippingQuotes.find((q) => q.methodRef === methodRef)
    if (!quote || !isShippingQuoteSelectable(quote, true)) {
      checkoutDbg.fn('selectShippingMethod', 'skip', { reason: 'free shipping locked', methodRef })
      return
    }
  }

  if (
    checkoutStore.selectedShippingMethodRef === methodRef &&
    checkoutStore.shippingSelectionPersisted
  ) {
    checkoutDbg.fn('selectShippingMethod', 'skip', { reason: 'already selected', methodRef })
    return
  }

  const previousRef = checkoutStore.selectedShippingMethodRef
  const wasPersisted = checkoutStore.shippingSelectionPersisted
  const quote = checkoutStore.shippingQuotes.find((q) => q.methodRef === methodRef)
  if (!quote) {
    checkoutDbg.fn('selectShippingMethod', 'skip', { reason: 'quote not in cache', methodRef })
    if (!options?.silent) checkoutStore.error = localeMessage('checkout.selectShipping')
    return
  }

  checkoutStore.shippingSelectingRef = methodRef
  checkoutStore.error = null
  checkoutStore.selectedShippingMethodRef = methodRef
  checkoutStore.shippingSelectionPersisted = false
  applyCartShippingTotals(quote.amountCents)
  if (previousRef !== methodRef) {
    checkoutStore.order = null
    checkoutStore.payment = null
    invalidateCheckoutTransitionPrefetch()
    checkoutDbg.state('selectShippingMethod:clearedPayment', { previousRef, methodRef })
  }

  let shouldPrefetchTransition = false
  try {
    checkoutDbg.api('shipping.select', { methodRef })
    const res = await api.shipping.select({
      shippingAddress: shippingAddressForQuotes(),
      methodRef,
    })
    checkoutStore.selectedShippingMethodRef = methodRef
    checkoutStore.shippingSelectionPersisted = true
    applyCartShippingTotals(res.amountCents)
    shouldPrefetchTransition = isSpedizioneCompartmentComplete()
    checkoutDbg.fn('selectShippingMethod', 'exit', { methodRef })
  } catch (e) {
    checkoutStore.selectedShippingMethodRef = previousRef
    checkoutStore.shippingSelectionPersisted = wasPersisted
    if (previousRef) {
      const previousQuote = checkoutStore.shippingQuotes.find((q) => q.methodRef === previousRef)
      if (previousQuote) applyCartShippingTotals(previousQuote.amountCents)
    } else if (cartStore.cart) {
      const subtotal =
        cartStore.cart.estimatedSubtotal ??
        cartStore.cart.items.reduce((s, i) => s + (i.lineTotalEstimateCents ?? 0), 0)
      const tax = cartStore.cart.estimatedTax ?? cartStore.cart.taxBreakdown?.taxCents ?? 0
      cartStore.cart = {
        ...cartStore.cart,
        estimatedShipping: null,
        estimatedTotal: subtotal + tax,
      }
    }
    if (!options?.silent) checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.shippingSelectingRef = null
  }

  if (shouldPrefetchTransition) {
    prefetchCheckoutTransitionToPayment()
  }
}

function checkoutBusinessPayload() {
  const viesStatus = checkoutStore.business.viesStatus
  const viesMeta = {
    viesName: checkoutStore.business.vatCompanyName ?? undefined,
    viesAddress: checkoutStore.business.viesAddress ?? undefined,
    viesValid:
      viesStatus === 'valid' ? true : viesStatus === 'invalid' ? false : undefined,
    viesRequestDate: checkoutStore.business.viesRequestDate ?? undefined,
  }

  if (isBusinessCheckout()) {
    return {
      companyName: checkoutStore.business.companyName.trim() || undefined,
      vatNumber: checkoutStore.business.vatNumber.trim() || undefined,
      fiscalCode: checkoutStore.business.fiscalCode.trim() || undefined,
      pec: checkoutStore.business.pec.trim() || undefined,
      sdiCode: checkoutStore.business.sdiCode.trim() || undefined,
      ...viesMeta,
    }
  }

  if (checkoutStore.business.fiscalCode.trim()) {
    return { fiscalCode: checkoutStore.business.fiscalCode.trim() }
  }

  return undefined
}

type CheckoutDraftStep = 'details' | 'shipping' | 'payment_method' | 'lock'

let checkoutDraftSyncPromise: Promise<void> | null = null

function checkoutPaymentPrefetchFingerprint(): string {
  return [
    checkoutStore.selectedShippingMethodRef ?? '',
    checkoutStore.selectedPaymentMethod ?? '',
    checkoutStore.order?.orderId ?? '',
    checkoutStore.draft.email,
    checkoutStore.draft.billingSameAsShipping ? 'same' : 'diff',
    shippingFingerprint(shippingAddressPayload()),
    shippingFingerprint(billingAddressPayload()),
  ].join('|')
}

/** Precarica ordine + sessione Stripe appena spedizione e dati sono completi. */
export function prefetchCheckoutPayment(): void {
  if (!authStore.isAuthenticated) return
  if (checkoutStore.checkoutMode === 'frozen_quote') return
  if (checkoutStore.selectedPaymentMethod !== 'stripe') return
  if (!canStartCheckout()) return
  if (!isSpedizioneCompartmentComplete()) return
  if (checkoutStore.payment?.method === 'stripe' && checkoutStore.payment.clientSecret) return
  if (checkoutStore.cartRefreshing || checkoutStore.shippingSelectingRef) return

  const key = checkoutPaymentPrefetchFingerprint()
  if (checkoutPaymentPrefetchPromise && checkoutPaymentPrefetchKey === key) return

  checkoutPaymentPrefetchKey = key
  checkoutDbg.fn('prefetchCheckoutPayment', 'enter', { key })
  checkoutPaymentPrefetchPromise = (async () => {
    try {
      if (!checkoutStore.order) await startCheckout({ silent: true })
      if (
        !checkoutStore.payment ||
        checkoutStore.payment.method !== checkoutStore.selectedPaymentMethod ||
        !checkoutStore.payment.clientSecret
      ) {
        await createPaymentSession({ silent: true })
      }
      checkoutDbg.fn('prefetchCheckoutPayment', 'exit', {
        orderId: checkoutStore.order?.orderId,
        hasClientSecret: Boolean(checkoutStore.payment?.clientSecret),
      })
    } catch (e) {
      checkoutDbg.fn('prefetchCheckoutPayment', 'error', { message: errMessage(e) })
    } finally {
      checkoutPaymentPrefetchPromise = null
    }
  })()
}

function canSyncCheckoutDraft(step: CheckoutDraftStep): boolean {
  if (!authStore.isAuthenticated) return false
  switch (step) {
    case 'details':
      return isAnagraficaCompartmentComplete()
    case 'shipping':
      return isSpedizioneCompartmentComplete()
    case 'payment_method':
    case 'lock':
      return isSpedizioneCompartmentComplete() && Boolean(checkoutStore.selectedPaymentMethod)
    default:
      return false
  }
}

function checkoutDraftBody(step: CheckoutDraftStep) {
  const email = ensureCheckoutEmailInDraft()
  return {
    step,
    orderId: checkoutStore.order?.orderId,
    ...(isCheckoutEmailValid(email) ? { email } : {}),
    customerSegment: effectiveCustomerSegment() ?? undefined,
    isProfessional:
      authStore.me?.isProfessional || authStore.me?.customerSegment === 'professional',
    billingAddress: billingAddressPayload(),
    shippingAddress: shippingAddressPayload(),
    business: checkoutBusinessPayload(),
    clientOrderRef: checkoutStore.clientOrderRef.trim() || undefined,
    deliveryRecipient: dropshipPayload(),
    orderNotes: checkoutStore.draft.orderNotes.trim() || undefined,
    vatValidated: checkoutStore.business.vatValidated || undefined,
    vatForceAccepted: checkoutStore.business.vatForceAccepted || undefined,
    paymentMethod: checkoutStore.selectedPaymentMethod,
  }
}

export async function syncCheckoutDraft(step: CheckoutDraftStep, options?: { silent?: boolean }) {
  checkoutDbg.fn('syncCheckoutDraft', 'enter', { step, silent: options?.silent, orderId: checkoutStore.order?.orderId })
  if (!canSyncCheckoutDraft(step)) {
    checkoutDbg.fn('syncCheckoutDraft', 'skip', { reason: 'canSyncCheckoutDraft=false', step })
    return
  }

  const run = async () => {
    if (!options?.silent) checkoutStore.isLoading = true
    checkoutStore.error = null
    try {
      checkoutDbg.api('checkout.patchDraft', { step, orderId: checkoutStore.order?.orderId })
      checkoutStore.order = await api.checkout.patchDraft(checkoutDraftBody(step))
      checkoutDbg.fn('syncCheckoutDraft', 'exit', { step, orderId: checkoutStore.order?.orderId })
    } catch (e) {
      checkoutStore.error = errMessage(e)
      checkoutDbg.fn('syncCheckoutDraft', 'error', { step, message: checkoutStore.error })
      throw e
    } finally {
      if (!options?.silent) checkoutStore.isLoading = false
    }
  }

  if (checkoutDraftSyncPromise) {
    checkoutDbg.fn('syncCheckoutDraft', 'skip', { reason: 'awaiting prior sync', step })
    await checkoutDraftSyncPromise.catch(() => undefined)
  }

  const promise = run()
  checkoutDraftSyncPromise = promise.then(
    () => undefined,
    () => undefined,
  )
  try {
    await promise
  } finally {
    if (checkoutDraftSyncPromise === promise) {
      checkoutDraftSyncPromise = null
    }
  }
}

export async function startCheckout(options?: { silent?: boolean }) {
  checkoutDbg.fn('startCheckout', 'enter', { silent: options?.silent, step: checkoutStore.currentStep })
  if (!authStore.isAuthenticated) {
    checkoutStore.error = localeMessage('checkout.error.authRequired')
    checkoutDbg.fn('startCheckout', 'skip', { reason: 'not authenticated' })
    throw new Error(checkoutStore.error)
  }
  if (!options?.silent) checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    checkoutDbg.api('checkout.start', { email: ensureCheckoutEmailInDraft() })
    checkoutStore.order = await api.checkout.start({
      email: ensureCheckoutEmailInDraft(),
      customerSegment: effectiveCustomerSegment() ?? undefined,
      isProfessional:
        authStore.me?.isProfessional || authStore.me?.customerSegment === 'professional',
      billingAddress: billingAddressPayload(),
      shippingAddress: shippingAddressPayload(),
      business: checkoutBusinessPayload(),
      clientOrderRef: checkoutStore.clientOrderRef.trim() || undefined,
      deliveryRecipient: dropshipPayload(),
      orderNotes: checkoutStore.draft.orderNotes.trim() || undefined,
      vatValidated: checkoutStore.business.vatValidated || undefined,
      vatForceAccepted: checkoutStore.business.vatForceAccepted || undefined,
      lockPrices: true,
    })
    checkoutDbg.fn('startCheckout', 'exit', { orderId: checkoutStore.order?.orderId })
  } catch (e) {
    checkoutStore.error = errMessage(e)
    checkoutDbg.fn('startCheckout', 'error', { message: checkoutStore.error })
    throw e
  } finally {
    if (!options?.silent) checkoutStore.isLoading = false
  }
}

export async function createPaymentSession(options?: { silent?: boolean }) {
  const orderId = checkoutStore.order?.orderId
  checkoutDbg.fn('createPaymentSession', 'enter', { orderId, method: checkoutStore.selectedPaymentMethod })
  if (!orderId) {
    checkoutStore.error = localeMessage('checkout.error.missingOrder')
    checkoutDbg.fn('createPaymentSession', 'skip', { reason: 'missing orderId' })
    return
  }
  if (!options?.silent) checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    checkoutDbg.api('payments.createSession', { orderId, method: checkoutStore.selectedPaymentMethod })
    checkoutStore.payment = await api.payments.createSession({
      orderId,
      paymentMethod: checkoutStore.selectedPaymentMethod,
    })
    const publishableKey = checkoutStore.payment?.publishableKey
    if (publishableKey) {
      const { preloadStripe } = await import('@/lib/stripe-loader')
      preloadStripe(publishableKey)
    }
    checkoutDbg.fn('createPaymentSession', 'exit', {
      orderId,
      method: checkoutStore.payment?.method,
      hasClientSecret: Boolean(checkoutStore.payment?.clientSecret),
    })
  } catch (e) {
    checkoutStore.error = errMessage(e)
    checkoutDbg.fn('createPaymentSession', 'error', { message: checkoutStore.error })
    throw e
  } finally {
    if (!options?.silent) checkoutStore.isLoading = false
  }
}

/** Rigenera la sessione Stripe quando il client_secret in memoria non è più attivo su Stripe. */
export async function refreshStaleStripePaymentSession(options?: { silent?: boolean }) {
  checkoutStore.payment = null
  await createPaymentSession(options)
}

export async function prepareCheckoutPayment(options?: { silent?: boolean }) {
  checkoutDbg.fn('prepareCheckoutPayment', 'enter', {
    hasOrder: Boolean(checkoutStore.order),
    hasPayment: Boolean(checkoutStore.payment),
    method: checkoutStore.selectedPaymentMethod,
  })
  if (!checkoutStore.order && !isFrozenQuoteCheckout()) {
    await startCheckout(options)
  }
  const payment = checkoutStore.payment
  if (!payment || payment.method !== checkoutStore.selectedPaymentMethod) {
    await createPaymentSession(options)
  }
  checkoutDbg.fn('prepareCheckoutPayment', 'exit', {
    orderId: checkoutStore.order?.orderId,
    hasClientSecret: Boolean(checkoutStore.payment?.clientSecret),
  })
}

export async function confirmPayment(mockStatus?: 'captured' | 'pending' | 'failed' | 'cancelled') {
  const paymentId = checkoutStore.payment?.paymentId
  if (!paymentId) {
    checkoutStore.error = localeMessage('checkout.error.missingPayment')
    return
  }
  checkoutStore.isPaying = true
  checkoutStore.error = null
  try {
    checkoutStore.result = await api.payments.confirm({ paymentId, mockStatus })
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.isPaying = false
  }
}

/** Avvia checkout da preventivo congelato (importi bloccati). */
export async function resumeFrozenQuoteCheckout(orderId: string) {
  const detail = await api.orders.thankYou(orderId)
  checkoutStore.checkoutMode = 'frozen_quote'
  checkoutStore.frozenOrderSummary = detail
  checkoutStore.order = {
    orderId: detail.orderId,
    checkoutSessionId: '',
    cartId: detail.cartId,
    odooSaleOrderId: detail.odooSaleOrderId,
    orderStatus: detail.orderStatus,
    paymentStatus: detail.paymentStatus,
    currencyCode: detail.currencyCode,
    amountTotal: detail.amountTotal,
  }
  checkoutStore.payment = null
  checkoutStore.selectedPaymentMethod = 'stripe'
  checkoutStore.selectedShippingMethodRef = detail.shippingMethodRef ?? 'frozen:quote'
  checkoutStore.shippingSelectionPersisted = true
  checkoutStore.currentStep = 'payment'
  checkoutStore.error = null
  if (detail.email) checkoutStore.draft.email = detail.email
  if (detail.shippingAddress) {
    checkoutStore.draft.shipping = { ...checkoutStore.draft.shipping, ...detail.shippingAddress }
    checkoutStore.draft.billing = { ...checkoutStore.draft.shipping }
    checkoutStore.draft.billingSameAsShipping = true
  }
  if (detail.taxCents != null) {
    checkoutStore.taxBreakdown = {
      netCents: detail.subtotalCents ?? 0,
      taxCents: detail.taxCents,
      grossCents:
        (detail.subtotalCents ?? 0) + detail.taxCents + (detail.shippingCents ?? 0),
      taxRatePct: 0,
      taxLabel: detail.taxLabel ?? '',
      isEstimate: false,
      disclaimerKey: detail.disclaimerKey ?? undefined,
      odooFiscalPositionId: null,
    }
  }
}

/** Riprende checkout dopo pagamento fallito: riusa PwaOrder, carrello intatto. */
export async function resumeCheckoutForOrder(orderId: string) {
  const detail = await api.orders.thankYou(orderId)
  if (detail.paymentStatus === 'captured') {
    throw new Error(localeMessage('checkout.error.alreadyPaid'))
  }
  checkoutStore.order = {
    orderId: detail.orderId,
    checkoutSessionId: '',
    cartId: detail.cartId,
    odooSaleOrderId: detail.odooSaleOrderId,
    orderStatus: detail.orderStatus,
    paymentStatus: detail.paymentStatus,
    currencyCode: detail.currencyCode,
    amountTotal: detail.amountTotal,
  }
  checkoutStore.payment = null
  if (detail.paymentMethod === 'stripe' || detail.paymentMethod === 'bank_transfer') {
    checkoutStore.selectedPaymentMethod = detail.paymentMethod
  }
  checkoutStore.currentStep = 'review'
  checkoutStore.error = detail.lastPaymentError
  if (detail.email) checkoutStore.draft.email = detail.email
  if (detail.shippingAddress) {
    checkoutStore.draft.shipping = { ...checkoutStore.draft.shipping, ...detail.shippingAddress }
    if (checkoutStore.draft.billingSameAsShipping) {
      checkoutStore.draft.billing = { ...checkoutStore.draft.shipping }
    }
  }
}

export async function completeBankTransferCheckout(): Promise<string> {
  await prepareCheckoutPayment()
  await confirmPayment('pending')
  const orderId =
    checkoutStore.result?.orderId ?? checkoutStore.order?.orderId ?? checkoutStore.payment?.orderId
  if (!orderId) {
    checkoutStore.error = localeMessage('checkout.error.orderUnavailable')
    throw new Error(checkoutStore.error)
  }
  return orderId
}

export function selectedShippingQuote() {
  const ref = checkoutStore.selectedShippingMethodRef
  if (!ref) return null
  return checkoutStore.shippingQuotes.find((q) => q.methodRef === ref) ?? null
}

/** @deprecated usa canAdvanceFromStep('addresses') */
export function canProceedFromDetails() {
  return canAdvanceFromStep('addresses') && isCheckoutEmailValid(resolveCheckoutEmail())
}

/** @deprecated usa advanceCheckoutStep */
export async function advanceToShippingStep() {
  if (!canProceedFromDetails()) {
    checkoutStore.error = localeMessage('checkout.error.incompleteAddress')
    return
  }
  checkoutStore.currentStep = 'addresses'
  if (canFetchShippingQuotes()) {
    await fetchShippingQuotes()
  }
}

/** @deprecated usa advanceCheckoutStep */
export function advanceToPaymentMethodStep() {
  if (!canStartCheckout()) {
    checkoutStore.error = localeMessage('checkout.selectShipping')
    return
  }
  checkoutStore.currentStep = 'review'
}

export function segmentLabel(segment: CustomerSegmentDTO | CustomerSegmentChoice): string {
  if (segment === 'business' || segment === 'professional') return 'business'
  return 'retail'
}
