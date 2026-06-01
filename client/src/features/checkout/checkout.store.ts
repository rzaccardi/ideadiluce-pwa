import { proxy } from 'valtio'
import type {
  CheckoutStartDTO,
  PaymentConfirmDTO,
  PaymentSessionDTO,
  PwaPaymentMethodDTO,
  ShippingQuoteDTO,
} from '@/types/dto'

export type CheckoutStep = 'details' | 'shipping' | 'payment_method' | 'payment' | 'result'

export const checkoutStore = proxy({
  order: null as CheckoutStartDTO | null,
  payment: null as PaymentSessionDTO | null,
  result: null as PaymentConfirmDTO | null,
  currentStep: 'details' as CheckoutStep,
  isLoading: false,
  isPaying: false,
  error: null as string | null,
  selectedPaymentMethod: 'stripe' as PwaPaymentMethodDTO,
  shippingQuotes: [] as ShippingQuoteDTO[],
  selectedShippingMethodRef: null as string | null,
  shippingLoading: false,
  draft: {
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
  },
})
