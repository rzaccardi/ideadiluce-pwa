import { getOdooCustomerPrefill, postOdooTestCheckout } from '@/api/integrations'
import { ApiRequestError } from '@/types/api'
import type { UserDTO } from '@/types/dto'
import type { AddressInput } from '@/types/integrations'
import { isCheckoutAddressValid } from '@/lib/checkout-address.validators'
import { formatTestCheckoutError } from '@/lib/checkoutTestErrors'
import { cartStore } from '@/features/cart/cart.store'
import { checkoutTestStore, emptyAddress } from './checkoutTest.store'

export function updateField(field: 'email', value: string) {
  if (field === 'email') checkoutTestStore.form.email = value
}

export function updateBillingAddressField<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
  checkoutTestStore.form.billing[key] = value as never
  if (checkoutTestStore.form.sameAsBilling) {
    checkoutTestStore.form.shipping[key] = value as never
  }
}

export function updateShippingAddressField<K extends keyof AddressInput>(key: K, value: AddressInput[K]) {
  checkoutTestStore.form.shipping[key] = value as never
}

export function setSameAsBilling(value: boolean) {
  checkoutTestStore.form.sameAsBilling = value
  if (value) {
    checkoutTestStore.form.shipping = { ...checkoutTestStore.form.billing }
  }
}

function setIfEmpty<K extends keyof AddressInput>(address: AddressInput, key: K, value: AddressInput[K] | null | undefined) {
  if (value == null || value === '') return
  const current = address[key]
  if (current == null || current === '') {
    address[key] = value as never
  }
}

function mergeMissingAddress(target: AddressInput, source: Partial<AddressInput>) {
  setIfEmpty(target, 'firstName', source.firstName)
  setIfEmpty(target, 'lastName', source.lastName)
  setIfEmpty(target, 'line1', source.line1)
  setIfEmpty(target, 'line2', source.line2)
  setIfEmpty(target, 'city', source.city)
  setIfEmpty(target, 'postalCode', source.postalCode)
  setIfEmpty(target, 'country', source.country)
  setIfEmpty(target, 'phone', source.phone)
}

function syncShippingWithBillingIfNeeded() {
  if (checkoutTestStore.form.sameAsBilling) {
    checkoutTestStore.form.shipping = { ...checkoutTestStore.form.billing }
  }
}

function localUserAddress(user: UserDTO): Partial<AddressInput> {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
  }
}

export async function prefillCheckoutTestFormFromUser(user: UserDTO | null) {
  if (!user) return
  if (!checkoutTestStore.form.email) {
    checkoutTestStore.form.email = user.email
  }

  mergeMissingAddress(checkoutTestStore.form.billing, localUserAddress(user))
  syncShippingWithBillingIfNeeded()

  const email = checkoutTestStore.form.email.trim()
  if (!email.includes('@')) return

  try {
    const prefill = await getOdooCustomerPrefill(email)
    if (prefill.profile) {
      mergeMissingAddress(checkoutTestStore.form.billing, prefill.profile)
      syncShippingWithBillingIfNeeded()
    }
  } catch {
    // Il checkout resta usabile con i dati locali anche se Odoo non risponde.
  }
}

export function clearResult() {
  checkoutTestStore.result = null
  checkoutTestStore.lastSubmittedAt = null
}

export function clearError() {
  checkoutTestStore.error = null
  checkoutTestStore.correlationId = null
}

export function resetCheckoutTestForm() {
  checkoutTestStore.form = {
    email: '',
    billing: emptyAddress(),
    shipping: emptyAddress(),
    sameAsBilling: true,
  }
}

function addressComplete(a: AddressInput): boolean {
  return isCheckoutAddressValid(a)
}

export function isTestCheckoutFormValid(): boolean {
  const { form } = checkoutTestStore
  const cartId = cartStore.cart?.id
  if (!cartId || !cartStore.cart?.items.length) return false
  if (!form.email.includes('@')) return false
  if (!addressComplete(form.billing)) return false
  const ship = form.sameAsBilling ? form.billing : form.shipping
  if (!addressComplete(ship)) return false
  return true
}

export async function submitTestCheckout() {
  const cartId = cartStore.cart?.id
  if (!cartId || !cartStore.cart?.items.length) {
    checkoutTestStore.error = 'Carrello vuoto o non caricato.'
    return
  }

  checkoutTestStore.isSubmitting = true
  checkoutTestStore.error = null
  checkoutTestStore.correlationId = null

  const { form } = checkoutTestStore
  const billing = { ...form.billing }
  const shipping = form.sameAsBilling ? { ...billing } : { ...form.shipping }

  try {
    const data = await postOdooTestCheckout({
      cartId,
      email: form.email.trim(),
      billingAddress: billing,
      shippingAddress: shipping,
    })
    checkoutTestStore.result = data
    checkoutTestStore.lastSubmittedAt = Date.now()
  } catch (e) {
    checkoutTestStore.error = formatTestCheckoutError(e)
    if (e instanceof ApiRequestError) {
      checkoutTestStore.correlationId = e.correlationId ?? null
    }
    checkoutTestStore.result = null
    throw e
  } finally {
    checkoutTestStore.isSubmitting = false
  }
}
