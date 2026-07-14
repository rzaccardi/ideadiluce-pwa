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
      return options?.accountConfirmed ? null : 'checkout.account.requiredHint'
    case 'customer_type':
      return 'checkout.customerType.hint'
    case 'addresses':
    case 'billing':
    case 'details':
      return 'checkout.addresses.subtitleUnified'
    case 'shipping':
      return options?.billingSameAsShipping
        ? 'checkout.shipping.addressSubtitle'
        : 'checkout.shipping.diffAddressSubtitle'
    case 'delivery_recipient':
      return 'checkout.deliveryRecipient.hint'
    case 'shipping_method':
      return 'checkout.shipping.methodSubtitle'
    case 'payment':
    case 'payment_method':
      return 'checkout.paymentNote'
    case 'review':
      return 'checkout.review.hint'
    default:
      return null
  }
}
