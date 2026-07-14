import { proxy } from 'valtio'
import type {
  CheckoutStartDTO,
  CustomerSegmentDTO,
  FreeShippingHintDTO,
  PaymentConfirmDTO,
  PaymentSessionDTO,
  PwaPaymentMethodDTO,
  ShippingQuoteDTO,
  TaxBreakdownDTO,
  ThankYouOrderDTO,
} from '@/types/dto'
import type { AddressInput } from '@/types/integrations'

export type CheckoutStep =
  | 'account'
  | 'customer_type'
  | 'addresses'
  /** @deprecated alias di `addresses` */
  | 'billing'
  /** @deprecated alias di `addresses` */
  | 'shipping'
  | 'delivery_recipient'
  | 'shipping_method'
  | 'payment'
  | 'review'
  /** Layout checkout semplificato (CheckoutPage legacy) */
  | 'details'
  | 'payment_method'

/** Metodi pagamento disponibili in checkout produzione. */
export type CheckoutPaymentMethodDTO = Extract<PwaPaymentMethodDTO, 'stripe' | 'bank_transfer'>

export type CheckoutMode = 'standard' | 'frozen_quote'

export type CustomerSegmentChoice = Extract<CustomerSegmentDTO, 'retail' | 'business'> | null

export type DeliveryRecipientMode = 'self' | 'other' | null

export const CHECKOUT_STEP_ORDER: CheckoutStep[] = [
  'account',
  'customer_type',
  'addresses',
  'delivery_recipient',
  'shipping_method',
  'payment',
  'review',
]

export function emptyCheckoutAddress(): AddressInput {
  return {
    firstName: '',
    lastName: '',
    line1: '',
    streetNumber: '',
    isSnc: false,
    line2: '',
    city: '',
    postalCode: '',
    country: 'IT',
    phone: '',
    courierNotes: '',
  }
}

export type CheckoutInitLoadingPhase = 'anagrafica' | 'indirizzi' | 'spedizioni'

export const checkoutStore = proxy({
  checkoutMode: 'standard' as CheckoutMode,
  frozenOrderSummary: null as ThankYouOrderDTO | null,
  order: null as CheckoutStartDTO | null,
  payment: null as PaymentSessionDTO | null,
  result: null as PaymentConfirmDTO | null,
  currentStep: 'account' as CheckoutStep,
  isLoading: false,
  isPaying: false,
  /** true mentre il carrello viene aggiornato dal riepilogo checkout (rimozione riga, cross-sell) */
  cartRefreshing: false,
  /** Fase overlay durante init checkout utente loggato (anagrafica → indirizzi → spedizioni). */
  initLoadingPhase: null as CheckoutInitLoadingPhase | null,
  /** true mentre si precompila e geocodifica l'indirizzo salvato (utente loggato) */
  addressPrefillLoading: false,
  /** true mentre si sincronizzano indirizzi/ordine prima dello step pagamento. */
  transitionToPaymentLoading: false,
  error: null as string | null,
  selectedPaymentMethod: 'stripe' as CheckoutPaymentMethodDTO,
  shippingQuotes: [] as ShippingQuoteDTO[],
  freeShippingHint: null as FreeShippingHintDTO | null,
  shippingQuotesFingerprint: null as string | null,
  selectedShippingMethodRef: null as string | null,
  /** true solo dopo POST /shipping/select riuscito */
  shippingSelectionPersisted: false,
  shippingQuotesLoading: false,
  shippingSelectingRef: null as string | null,
  deliveryEstimateDays: null as number | null,
  customerSegment: null as CustomerSegmentChoice,
  taxBreakdown: null as TaxBreakdownDTO | null,
  taxCalculating: false,
  business: {
    companyName: '',
    vatNumber: '',
    fiscalCode: '',
    pec: '',
    sdiCode: '',
    vatValidated: false,
    vatForceAccepted: false,
    vatAttempts: 0,
    vatCompanyName: null as string | null,
    viesAddress: null as string | null,
    viesRequestDate: null as string | null,
    fiscalCodeValid: null as boolean | null,
    fiscalCodeError: null as string | null,
    vatFormatValid: null as boolean | null,
    vatChecksumValid: null as boolean | null,
    vatError: null as string | null,
    viesStatus: null as import('@/types/dto').ViesValidationStatusDTO | null,
    taxValidating: false,
  },
  deliveryRecipient: {
    mode: 'self' as DeliveryRecipientMode,
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  },
  termsAccepted: false,
  /** Dati fiscali/azienda raccolti allo step account (registrazione checkout). */
  anagraficaCollectedAtAccount: false,
  clientOrderRef: '',
  dropshipAddress: emptyCheckoutAddress(),
  draft: {
    email: '',
    orderNotes: '',
    billingSameAsShipping: true,
    billing: emptyCheckoutAddress(),
    shipping: emptyCheckoutAddress(),
  },
})
