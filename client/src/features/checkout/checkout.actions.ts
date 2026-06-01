import { api } from '@/api/endpoints'
import { ApiRequestError } from '@/types/api'
import { checkoutStore, type CheckoutStep } from './checkout.store'
import type { PwaPaymentMethodDTO } from '@/types/dto'
import { fetchCart } from '@/features/cart'

function errMessage(e: unknown) {
  return e instanceof ApiRequestError ? (e.userMessage ?? e.message) : 'Errore checkout'
}

function shippingAddressPayload() {
  const { draft } = checkoutStore
  return checkoutStore.draft.sameAsBilling ? { ...draft.billing } : { ...draft.shipping }
}

export function setCheckoutStep(step: CheckoutStep) {
  checkoutStore.currentStep = step
}

export function resetCheckout() {
  checkoutStore.order = null
  checkoutStore.payment = null
  checkoutStore.result = null
  checkoutStore.currentStep = 'details'
  checkoutStore.error = null
  checkoutStore.isPaying = false
  checkoutStore.selectedPaymentMethod = 'stripe'
  checkoutStore.shippingQuotes = []
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingLoading = false
  checkoutStore.draft = {
    email: '',
    sameAsBilling: true,
    billing: {
      firstName: '',
      lastName: '',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: 'IT',
      phone: '',
    },
    shipping: {
      firstName: '',
      lastName: '',
      line1: '',
      line2: '',
      city: '',
      postalCode: '',
      country: 'IT',
      phone: '',
    },
  }
}

export function setPaymentMethod(method: PwaPaymentMethodDTO) {
  checkoutStore.selectedPaymentMethod = method
}

export function updateCheckoutEmail(email: string) {
  checkoutStore.draft.email = email
}

type AddressKey = keyof typeof checkoutStore.draft.billing

export function updateCheckoutAddress(kind: 'billing' | 'shipping', key: AddressKey, value: string) {
  checkoutStore.draft[kind][key] = value as never
  if (kind === 'billing' && checkoutStore.draft.sameAsBilling) {
    checkoutStore.draft.shipping[key] = value as never
  }
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingQuotes = []
}

export function setSameAsBilling(value: boolean) {
  checkoutStore.draft.sameAsBilling = value
  if (value) checkoutStore.draft.shipping = { ...checkoutStore.draft.billing }
  checkoutStore.selectedShippingMethodRef = null
  checkoutStore.shippingQuotes = []
}

function addressComplete(address: typeof checkoutStore.draft.billing) {
  return Boolean(
    address.firstName.trim() &&
      address.lastName.trim() &&
      address.line1.trim() &&
      address.city.trim() &&
      address.postalCode.trim() &&
      address.country.trim(),
  )
}

export function canFetchShippingQuotes() {
  return addressComplete(shippingAddressPayload())
}

export function canStartCheckout() {
  const { draft } = checkoutStore
  return (
    draft.email.includes('@') &&
    addressComplete(draft.billing) &&
    addressComplete(draft.sameAsBilling ? draft.billing : draft.shipping) &&
    Boolean(checkoutStore.selectedShippingMethodRef)
  )
}

export async function fetchShippingQuotes() {
  checkoutStore.shippingLoading = true
  checkoutStore.error = null
  try {
    checkoutStore.shippingQuotes = await api.shipping.quotes({
      shippingAddress: shippingAddressPayload(),
    })
    checkoutStore.currentStep = 'shipping'
    if (checkoutStore.shippingQuotes.length === 1) {
      checkoutStore.selectedShippingMethodRef = checkoutStore.shippingQuotes[0]!.methodRef
    }
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.shippingLoading = false
  }
}

export async function selectShippingMethod(methodRef: string) {
  checkoutStore.shippingLoading = true
  checkoutStore.error = null
  try {
    await api.shipping.select({
      shippingAddress: shippingAddressPayload(),
      methodRef,
    })
    checkoutStore.selectedShippingMethodRef = methodRef
    await fetchCart()
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.shippingLoading = false
  }
}

export async function startCheckout() {
  checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    const billingAddress = { ...checkoutStore.draft.billing }
    const shippingAddress = shippingAddressPayload()
    checkoutStore.order = await api.checkout.start({
      email: checkoutStore.draft.email.trim(),
      billingAddress,
      shippingAddress,
    })
    checkoutStore.currentStep = 'payment_method'
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.isLoading = false
  }
}

export async function createPaymentSession() {
  const orderId = checkoutStore.order?.orderId
  if (!orderId) {
    checkoutStore.error = 'Ordine checkout mancante'
    return
  }
  checkoutStore.isLoading = true
  checkoutStore.error = null
  try {
    checkoutStore.payment = await api.payments.createSession({
      orderId,
      paymentMethod: checkoutStore.selectedPaymentMethod,
    })
    checkoutStore.currentStep = 'payment'
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.isLoading = false
  }
}

export async function confirmPayment(mockStatus?: 'captured' | 'pending' | 'failed' | 'cancelled') {
  const paymentId = checkoutStore.payment?.paymentId
  if (!paymentId) {
    checkoutStore.error = 'Pagamento mancante'
    return
  }
  checkoutStore.isPaying = true
  checkoutStore.error = null
  try {
    checkoutStore.result = await api.payments.confirm({ paymentId, mockStatus })
    checkoutStore.currentStep = 'result'
  } catch (e) {
    checkoutStore.error = errMessage(e)
    throw e
  } finally {
    checkoutStore.isPaying = false
  }
}
