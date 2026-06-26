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
import type { CartDTO, CustomerSegmentDTO, ShippingQuoteDTO, TaxValidationResultDTO, ThankYouOrderDTO } from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import type { ResolvedAddress } from '@/lib/addressAutocomplete'
import {
  hasPrefilledAddress,
  refreshAddressAutocompleteStatus,
  resolvePrefilledAddress,
} from '@/lib/addressAutocomplete'
import { isCheckoutAddressValid } from '@/lib/checkout-address.validators'
import { fetchCart } from '@/features/cart'
import { cartStore } from '@/features/cart/cart.store'
import {
  filterVisibleShippingQuotes,
  isFreeShippingLocked,
  isFreeShippingQuote,
} from './shipping-quotes'

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
  return { ...checkoutStore.draft.shipping }
}

function billingAddressPayload() {
  const { draft } = checkoutStore
  return draft.billingSameAsShipping ? { ...draft.shipping } : { ...draft.billing }
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

function checkoutNetCents(): number {
  const cart = cartStore.cart
  if (!cart) return 0
  if (cart.taxBreakdown?.netCents != null) return cart.taxBreakdown.netCents
  if (cart.estimatedSubtotal != null) return cart.estimatedSubtotal
  return cart.items.reduce((s, i) => s + (i.lineTotalEstimateCents ?? 0), 0)
}

function scheduleTaxRecalculate(delayMs = 450) {
  if (taxRecalcDebounce) clearTimeout(taxRecalcDebounce)
  const ship = shippingAddressPayload()
  if (!destinationComplete(ship)) return
  taxRecalcDebounce = setTimeout(() => {
    taxRecalcDebounce = null
    void refreshTaxBreakdown()
  }, delayMs)
}

export async function refreshTaxBreakdown() {
  const ship = shippingAddressPayload()
  const bill = billingAddressPayload()
  if (!destinationComplete(ship)) {
    checkoutStore.taxBreakdown = null
    return
  }
  checkoutStore.taxCalculating = true
  try {
    const segment = effectiveCustomerSegment()
    checkoutStore.taxBreakdown = await api.tax.calculate({
      netCents: checkoutNetCents(),
      billingCountry: bill.country,
      shippingCountry: ship.country,
      customerSegment: segment ?? 'retail',
      isProfessional: authStore.me?.customerSegment === 'professional',
      vatValidated: checkoutStore.business.vatValidated || undefined,
      vatForceAccepted: checkoutStore.business.vatForceAccepted || undefined,
    })
  } catch {
    checkoutStore.taxBreakdown = null
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
  } else if (!checkoutStore.business.fiscalCode.trim()) {
    checkoutStore.business.fiscalCodeValid = null
  }

  if (res.vat) {
    checkoutStore.business.vatFormatValid = res.vat.formatValid
    checkoutStore.business.vatChecksumValid = res.vat.checksumValid
    checkoutStore.business.viesStatus = res.vat.vies.status
    checkoutStore.business.viesAddress = res.vat.vies.address
    checkoutStore.business.viesRequestDate = res.vat.vies.requestDate

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
    checkoutStore.business.viesStatus = null
    checkoutStore.business.viesAddress = null
    checkoutStore.business.viesRequestDate = null
  }
}

export async function validateTaxFields() {
  const country = billingAddressPayload().country.toUpperCase()
  const fiscalCode = checkoutStore.business.fiscalCode.trim()
  const vatNumber = checkoutStore.business.vatNumber.trim()
  const business = isBusinessCheckout()

  if (!fiscalCode && !vatNumber) {
    checkoutStore.business.fiscalCodeValid = null
    checkoutStore.business.vatFormatValid = null
    checkoutStore.business.vatChecksumValid = null
    checkoutStore.business.viesStatus = null
    return null
  }

  checkoutStore.business.taxValidating = true
  checkoutStore.error = null
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
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.business.taxValidating = false
  }
}

export async function validateCheckoutVat() {
  checkoutStore.error = null
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
    scheduleTaxRecalculate(0)
    return res
  } catch (e) {
    if (e instanceof ApiRequestError) {
      const details = e.details as { attempts?: number } | undefined
      if (details?.attempts != null) checkoutStore.business.vatAttempts = details.attempts
      checkoutStore.business.vatValidated = false
    }
    checkoutStore.error = errMessage(e)
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
    checkoutStore.shippingQuotes = []
    checkoutStore.freeShippingHint = null
    checkoutStore.selectedShippingMethodRef = null
    checkoutStore.shippingSelectionPersisted = false
  }
}

function scheduleShippingQuotesFetch(delayMs = 450) {
  if (shippingQuotesDebounce) clearTimeout(shippingQuotesDebounce)

  const addr = shippingAddressPayload()
  if (!destinationComplete(addr)) {
    shippingQuotesDebounce = null
    return
  }

  shippingQuotesDebounce = setTimeout(() => {
    shippingQuotesDebounce = null
    void refreshShippingQuotesIfNeeded()
  }, delayMs)
}

async function refreshShippingQuotesIfNeeded() {
  const addr = shippingAddressPayload()
  if (!destinationComplete(addr)) return

  const fp = shippingFingerprint(addr)
  if (
    checkoutStore.shippingQuotesFingerprint === fp &&
    checkoutStore.shippingQuotes.length > 0
  ) {
    return
  }

  if (checkoutStore.shippingQuotesLoading) {
    scheduleShippingQuotesFetch(300)
    return
  }

  try {
    await fetchShippingQuotes()
  } catch {
    // errore già in checkoutStore.error
  }
}

function addressComplete(address: AddressInput) {
  return isCheckoutAddressValid(address)
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
    if (country === 'IT' && fc) {
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
  if (checkoutStore.deliveryRecipient.mode !== 'other') return undefined
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
  if (isFrozenQuoteCheckout()) {
    return step !== 'payment' && step !== 'review'
  }
  if (step === 'account' && authStore.isAuthenticated) return true
  if (step === 'customer_type' && effectiveCustomerSegment() != null) return true
  if (step === 'delivery_recipient' && !isBusinessCheckout()) return true
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
  return getNextCheckoutStep('account') ?? 'billing'
}

export function prefillCheckoutFromAuthUser() {
  const user = authStore.me
  if (!user) return
  if (user.email) checkoutStore.draft.email = user.email
  if (user.firstName) checkoutStore.draft.shipping.firstName = user.firstName
  if (user.lastName) checkoutStore.draft.shipping.lastName = user.lastName
  if (user.phone) checkoutStore.draft.shipping.phone = user.phone
  const segment = segmentFromAuth()
  if (segment) checkoutStore.customerSegment = segment
  if (user.companyName) checkoutStore.business.companyName = user.companyName
  if (user.vatNumber) checkoutStore.business.vatNumber = user.vatNumber
  if (user.viesName) checkoutStore.business.vatCompanyName = user.viesName
  if (user.viesAddress) checkoutStore.business.viesAddress = user.viesAddress
  if (user.viesValid != null) checkoutStore.business.vatValidated = user.viesValid
  if (user.taxCheckedAt) checkoutStore.business.viesRequestDate = user.taxCheckedAt
  if (user.fiscalCode) checkoutStore.business.fiscalCode = user.fiscalCode
  if (user.pec) checkoutStore.business.pec = user.pec
  if (user.sdiCode) checkoutStore.business.sdiCode = user.sdiCode
  const addr = user.shippingAddress
  if (addr) {
    if (addr.firstName) checkoutStore.draft.shipping.firstName = addr.firstName
    if (addr.lastName) checkoutStore.draft.shipping.lastName = addr.lastName
    if (addr.line1) checkoutStore.draft.shipping.line1 = addr.line1
    if (addr.streetNumber) checkoutStore.draft.shipping.streetNumber = addr.streetNumber
    if (addr.isSnc) checkoutStore.draft.shipping.isSnc = addr.isSnc
    if (addr.line2) checkoutStore.draft.shipping.line2 = addr.line2 ?? ''
    if (addr.city) checkoutStore.draft.shipping.city = addr.city
    if (addr.postalCode) checkoutStore.draft.shipping.postalCode = addr.postalCode
    if (addr.country) checkoutStore.draft.shipping.country = addr.country
    if (addr.phone) checkoutStore.draft.shipping.phone = addr.phone ?? ''
  }
  if (checkoutStore.draft.billingSameAsShipping) {
    checkoutStore.draft.billing = { ...checkoutStore.draft.shipping }
  }
}

export function setCheckoutStep(step: CheckoutStep) {
  checkoutStore.currentStep = step
}

let addressPrefillPromise: Promise<void> | null = null

async function resolveShippingAddressPrefillIfNeeded() {
  const shipping = checkoutStore.draft.shipping
  if (!hasPrefilledAddress(shipping)) return

  checkoutStore.addressPrefillLoading = true
  try {
    await refreshAddressAutocompleteStatus()
    const resolved = await resolvePrefilledAddress(shipping)
    if (resolved) {
      await applyResolvedAddress('shipping', resolved)
    }
  } finally {
    checkoutStore.addressPrefillLoading = false
  }
}

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
  prefillCheckoutFromAuthUser()

  const shipping = checkoutStore.draft.shipping
  const billing = checkoutStore.draft.billing
  const needsGeocode =
    hasPrefilledAddress(shipping) ||
    (!checkoutStore.draft.billingSameAsShipping && hasPrefilledAddress(billing))

  if (!needsGeocode) {
    checkoutStore.addressPrefillLoading = false
    checkoutStore.currentStep = resolveInitialCheckoutStep()
    return
  }

  checkoutStore.addressPrefillLoading = true
  checkoutStore.currentStep = 'account'
  try {
    await refreshAddressAutocompleteStatus()
    await resolvePrefilledCheckoutAddressesFromAuth()
  } finally {
    checkoutStore.addressPrefillLoading = false
    checkoutStore.currentStep = resolveInitialCheckoutStep()
  }
}

export function initializeCheckoutNavigation(): Promise<void> {
  if (!authStore.isAuthenticated) {
    checkoutStore.currentStep = 'account'
    checkoutStore.addressPrefillLoading = false
    return Promise.resolve()
  }

  if (addressPrefillPromise) return addressPrefillPromise

  addressPrefillPromise = runAddressPrefillInit().finally(() => {
    addressPrefillPromise = null
  })
  return addressPrefillPromise
}

/** Dopo login/registrazione: precompila, geocodifica e poi avanza allo step indirizzo. */
export async function prepareCheckoutAfterAuth() {
  if (addressPrefillPromise) {
    await addressPrefillPromise
    return
  }
  await runAddressPrefillInit()
}

/** Dopo modifica righe carrello: azzera pagamento e spedizione già calcolati. */
export function invalidateCheckoutAfterCartChange() {
  checkoutStore.payment = null
  checkoutStore.shippingQuotes = []
  checkoutStore.freeShippingHint = null
  checkoutStore.shippingQuotesFingerprint = null
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingSelectionPersisted = false
  checkoutStore.taxBreakdown = null
  if (
    checkoutStore.currentStep !== 'account' &&
    checkoutStore.currentStep !== 'billing' &&
    checkoutStore.currentStep !== 'shipping' &&
    destinationComplete(shippingAddressPayload())
  ) {
    scheduleShippingQuotesFetch(0)
    scheduleTaxRecalculate(0)
  }
}

export function resetCheckout(options?: { legacyLayout?: boolean }) {
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
    vatFormatValid: null,
    vatChecksumValid: null,
    viesStatus: null,
    taxValidating: false,
  }
  checkoutStore.clientOrderRef = ''
  checkoutStore.dropshipAddress = emptyCheckoutAddress()
  checkoutStore.deliveryRecipient = {
    mode: null,
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  }
  checkoutStore.termsAccepted = false
  checkoutStore.anagraficaCollectedAtAccount = false
  checkoutStore.checkoutMode = 'standard'
  checkoutStore.frozenOrderSummary = null
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
  checkoutStore.shippingSelectionPersisted = false
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingQuotes = []
  checkoutStore.shippingQuotesFingerprint = null
  checkoutStore.freeShippingHint = null
  checkoutStore.taxBreakdown = null
  checkoutStore.clientOrderRef = ''
  checkoutStore.anagraficaCollectedAtAccount = false
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
    vatFormatValid: null,
    vatChecksumValid: null,
    viesStatus: null,
    taxValidating: false,
  }
  checkoutStore.currentStep = 'account'
}

export function setPaymentMethod(method: CheckoutPaymentMethodDTO) {
  if (checkoutStore.selectedPaymentMethod !== method) {
    checkoutStore.payment = null
    checkoutStore.order = null
  }
  checkoutStore.selectedPaymentMethod = method
}

export function setCustomerSegment(segment: CustomerSegmentChoice) {
  checkoutStore.customerSegment = segment
}

export function markAnagraficaCollectedAtAccount() {
  checkoutStore.anagraficaCollectedAtAccount = true
}

export function setDeliveryRecipientMode(mode: DeliveryRecipientMode) {
  checkoutStore.deliveryRecipient.mode = mode
}

export function updateDeliveryRecipientField(
  key: 'firstName' | 'lastName' | 'company' | 'phone',
  value: string,
) {
  checkoutStore.deliveryRecipient[key] = value
}

export function updateDropshipAddress<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
  checkoutStore.dropshipAddress[key] = value as never
}

export function updateBusinessField(
  key: 'companyName' | 'vatNumber' | 'fiscalCode' | 'pec' | 'sdiCode',
  value: string,
) {
  checkoutStore.business[key] = value
  if (key === 'vatNumber') {
    checkoutStore.business.vatValidated = false
    checkoutStore.business.vatForceAccepted = false
    checkoutStore.business.vatCompanyName = null
    checkoutStore.business.viesAddress = null
    checkoutStore.business.viesRequestDate = null
    checkoutStore.business.vatFormatValid = null
    checkoutStore.business.vatChecksumValid = null
    checkoutStore.business.viesStatus = null
    scheduleTaxRecalculate()
  }
  if (key === 'fiscalCode') {
    checkoutStore.business.fiscalCodeValid = null
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
  if (kind === 'billing' && checkoutStore.draft.billingSameAsShipping) {
    checkoutStore.draft.shipping[key] = value
  }
  if (kind === 'shipping' && checkoutStore.draft.billingSameAsShipping) {
    checkoutStore.draft.billing[key] = value
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
  if (kind === 'shipping' && checkoutStore.draft.billingSameAsShipping) {
    checkoutStore.draft.billing = { ...checkoutStore.draft.shipping }
  }
  if (kind === 'billing' && checkoutStore.draft.billingSameAsShipping) {
    checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
  }
  if (!options?.skipInvalidation) {
    invalidateShippingIfDestinationChanged()
  }
  if (kind === 'shipping') {
    scheduleShippingQuotesFetch(options?.skipInvalidation ? 0 : 450)
  }
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
}

export function setBillingSameAsShipping(value: boolean) {
  checkoutStore.draft.billingSameAsShipping = value
  if (value) checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
  invalidateShippingIfDestinationChanged()
}

/** @deprecated usa setBillingSameAsShipping */
export function setSameAsBilling(value: boolean) {
  setBillingSameAsShipping(value)
}

export function canFetchShippingQuotes() {
  return destinationComplete(shippingAddressPayload())
}

export function canAdvanceFromStep(step: CheckoutStep): boolean {
  switch (step) {
    case 'account':
      return authStore.isAuthenticated
    case 'customer_type':
      return effectiveCustomerSegment() != null
    case 'billing':
      return addressComplete(checkoutStore.draft.billing) && businessBillingComplete()
    case 'shipping':
      return addressComplete(checkoutStore.draft.shipping)
    case 'delivery_recipient': {
      if (!isBusinessCheckout()) return true
      const r = checkoutStore.deliveryRecipient
      if (r.mode === 'self') return true
      if (r.mode === 'other') {
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
  if (isFrozenQuoteCheckout()) {
    return Boolean(checkoutStore.order?.orderId) && Boolean(checkoutStore.selectedPaymentMethod)
  }
  return (
    authStore.isAuthenticated &&
    checkoutStore.draft.email.includes('@') &&
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

export async function advanceCheckoutStep() {
  const step = checkoutStore.currentStep

  if (step !== 'billing' && !canAdvanceFromStep(step)) {
    checkoutStore.error = localeMessage('checkout.error.incompleteStep')
    return
  }

  checkoutStore.error = null
  checkoutStore.isLoading = true

  try {
    if (step === 'billing') {
      await validateTaxFields()
      if (!canAdvanceFromStep(step)) {
        checkoutStore.error = localeMessage('checkout.error.incompleteStep')
        return
      }
      if (checkoutStore.draft.billingSameAsShipping) {
        checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
      }
    }

    if (step === 'shipping' || step === 'delivery_recipient') {
      await fetchShippingQuotes()
    }

    const next = getNextCheckoutStep(step)
    if (!next) return

    checkoutStore.currentStep = next

    if (step === 'billing' && next === 'shipping') {
      await resolveShippingAddressPrefillIfNeeded()
    }

    if (step === 'shipping' || step === 'delivery_recipient') {
      void syncCheckoutDraft('details', { silent: true }).catch(() => {})
    }
    if (step === 'shipping_method') {
      void syncCheckoutDraft('shipping', { silent: true }).catch(() => {})
    }
    if (next === 'review') {
      void syncCheckoutDraft('lock', { silent: true }).catch(() => {})
    }

    if (next === 'shipping_method' && checkoutStore.shippingQuotes.length === 0 && canFetchShippingQuotes()) {
      await fetchShippingQuotes()
    }
  } catch {
    /* errore già in store */
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

export async function fetchShippingQuotes() {
  checkoutStore.shippingQuotesLoading = true
  checkoutStore.error = null
  try {
    const res = await api.shipping.quotes({
      shippingAddress: shippingAddressForQuotes(),
    })
    checkoutStore.freeShippingHint = res.freeShippingHint
    checkoutStore.deliveryEstimateDays = res.deliveryEstimateDays ?? null
    checkoutStore.shippingQuotes = filterVisibleShippingQuotes(res.quotes, res.freeShippingHint)
    checkoutStore.shippingQuotesFingerprint = shippingFingerprint(shippingAddressPayload())
    await autoSelectShippingQuote(checkoutStore.shippingQuotes)
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.shippingQuotesLoading = false
  }
}

export async function selectShippingMethod(methodRef: string, options?: { silent?: boolean }) {
  if (freeShippingSelectionLocked()) {
    const freeRef = checkoutStore.shippingQuotes.find(isFreeShippingQuote)?.methodRef
    if (freeRef && methodRef !== freeRef) {
      return
    }
  }

  if (
    checkoutStore.selectedShippingMethodRef === methodRef &&
    checkoutStore.shippingSelectionPersisted &&
    checkoutStore.shippingSelectingRef == null
  ) {
    return
  }

  const previousRef = checkoutStore.selectedShippingMethodRef
  checkoutStore.shippingSelectingRef = methodRef
  checkoutStore.error = null
  try {
    await api.shipping.select({
      shippingAddress: shippingAddressForQuotes(),
      methodRef,
    })
    if (previousRef !== methodRef) {
      checkoutStore.order = null
      checkoutStore.payment = null
    }
    checkoutStore.selectedShippingMethodRef = methodRef
    checkoutStore.shippingSelectionPersisted = true
    await fetchCart()
    void syncCheckoutDraft('shipping', { silent: true }).catch(() => {})
    scheduleTaxRecalculate(0)
  } catch (e) {
    if (checkoutStore.selectedShippingMethodRef === methodRef) {
      checkoutStore.shippingSelectionPersisted = false
    }
    if (!options?.silent) checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.shippingSelectingRef = null
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

function checkoutDraftBody(step: CheckoutDraftStep) {
  return {
    step,
    orderId: checkoutStore.order?.orderId,
    email: checkoutStore.draft.email.trim(),
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
  if (!authStore.isAuthenticated) return
  if (!options?.silent) checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    checkoutStore.order = await api.checkout.patchDraft(checkoutDraftBody(step))
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    if (!options?.silent) checkoutStore.isLoading = false
  }
}

export async function startCheckout(options?: { silent?: boolean }) {
  if (!authStore.isAuthenticated) {
    checkoutStore.error = localeMessage('checkout.error.authRequired')
    throw new Error(checkoutStore.error)
  }
  if (!options?.silent) checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    checkoutStore.order = await api.checkout.start({
      email: checkoutStore.draft.email.trim(),
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
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    if (!options?.silent) checkoutStore.isLoading = false
  }
}

export async function createPaymentSession(options?: { silent?: boolean }) {
  const orderId = checkoutStore.order?.orderId
  if (!orderId) {
    checkoutStore.error = localeMessage('checkout.error.missingOrder')
    return
  }
  if (!options?.silent) checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    checkoutStore.payment = await api.payments.createSession({
      orderId,
      paymentMethod: checkoutStore.selectedPaymentMethod,
    })
    const publishableKey = checkoutStore.payment?.publishableKey
    if (publishableKey) {
      const { preloadStripe } = await import('@/lib/stripe-loader')
      preloadStripe(publishableKey)
    }
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    if (!options?.silent) checkoutStore.isLoading = false
  }
}

export async function prepareCheckoutPayment(options?: { silent?: boolean }) {
  if (!checkoutStore.order && !isFrozenQuoteCheckout()) {
    await startCheckout(options)
  }
  if (!checkoutStore.payment) await createPaymentSession(options)
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

/** @deprecated usa canAdvanceFromStep('billing') + canAdvanceFromStep('shipping') */
export function canProceedFromDetails() {
  return canAdvanceFromStep('billing') && canAdvanceFromStep('shipping') && checkoutStore.draft.email.includes('@')
}

/** @deprecated usa advanceCheckoutStep */
export async function advanceToShippingStep() {
  if (!canProceedFromDetails()) {
    checkoutStore.error = localeMessage('checkout.error.incompleteAddress')
    return
  }
  checkoutStore.currentStep = 'shipping'
  await fetchShippingQuotes()
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
