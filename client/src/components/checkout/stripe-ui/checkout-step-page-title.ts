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
        : 'checkout.steps.pageTitle.account'
    case 'customer_type':
      return 'checkout.steps.customerType'
    case 'addresses':
    case 'billing':
    case 'details':
      return 'checkout.steps.addressesAndShipping'
    case 'shipping':
      return 'checkout.shippingAddress'
    case 'delivery_recipient':
      return 'checkout.steps.deliveryRecipient'
    case 'shipping_method':
      return 'checkout.shipping.title'
    case 'payment':
    case 'payment_method':
      return 'checkout.payment'
    case 'review':
      return 'checkout.steps.review'
    default:
      return 'checkout.steps.title'
  }
}
