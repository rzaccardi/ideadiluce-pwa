import { proxy } from 'valtio'
import type { AddressInput, TestCheckoutResponse } from '@/types/integrations'

export function emptyAddress(): AddressInput {
  return {
    firstName: '',
    lastName: '',
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'IT',
    phone: '',
  }
}

export type CheckoutTestForm = {
  email: string
  billing: AddressInput
  shipping: AddressInput
  sameAsBilling: boolean
}

export const checkoutTestStore = proxy({
  form: {
    email: '',
    billing: emptyAddress(),
    shipping: emptyAddress(),
    sameAsBilling: true,
  } as CheckoutTestForm,
  result: null as TestCheckoutResponse | null,
  isSubmitting: false,
  error: null as string | null,
  /** Ultimo correlationId da errore API (header eco dal backend). */
  correlationId: null as string | null,
  lastSubmittedAt: null as number | null,
})
