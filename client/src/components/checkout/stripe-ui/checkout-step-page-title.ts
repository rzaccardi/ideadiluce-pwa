import type { CheckoutStep } from '@/features/checkout'
import type { MessageKey } from '@/i18n/messages'

/** Titolo pagina (h1) checkout per ogni micro-step. */
export function checkoutStepPageTitleKey(
  step: CheckoutStep,
  options?: { accountConfirmed?: boolean },
): MessageKey {
  switch (step) {
    case 'account':
      return options?.accountConfirmed
        ? 'checkout.steps.pageTitle.accountConfirm'
        : 'checkout.contactInfo'
    case 'customer_type':
      return 'checkout.contactInfo'
    case 'addresses':
    case 'billing':
    case 'details':
    case 'shipping':
    case 'delivery_recipient':
    case 'shipping_method':
      return 'checkout.shippingAddress'
    case 'payment':
    case 'payment_method':
    case 'review':
      return 'checkout.steps.group.payment'
    default:
      return 'checkout.steps.title'
  }
}
