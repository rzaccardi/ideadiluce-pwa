import type { CheckoutStep } from '@/features/checkout'
import type { MessageKey } from '@/i18n/messages'

type SubtitleOptions = {
  accountConfirmed?: boolean
  billingSameAsShipping?: boolean
}

/** Sottotitolo pagina checkout (sotto h1) per ogni micro-step. */
export function checkoutStepPageSubtitleKey(
  step: CheckoutStep,
  options?: SubtitleOptions,
): MessageKey | null {
  switch (step) {
    case 'account':
    case 'customer_type':
      return options?.accountConfirmed ? null : 'checkout.account.requiredHint'
    case 'addresses':
    case 'billing':
    case 'details':
    case 'shipping':
    case 'delivery_recipient':
    case 'shipping_method':
      return 'checkout.addresses.subtitleUnified'
    case 'payment':
    case 'payment_method':
    case 'review':
      return 'checkout.paymentNote'
    default:
      return null
  }
}
