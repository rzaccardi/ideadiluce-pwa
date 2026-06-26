import { t, type MessageKey } from '@/i18n/messages'
import type { PwaLocale } from '@/lib/locale'
import type { PwaPaymentMethodDTO } from '@/types/dto'

const PAYMENT_METHOD_KEYS: Record<PwaPaymentMethodDTO, MessageKey> = {
  stripe: 'paymentMethod.stripe',
  bank_transfer: 'paymentMethod.bankTransfer',
  card_nexi: 'paymentMethod.stripe',
  paypal: 'paymentMethod.stripe',
  google_pay: 'paymentMethod.stripe',
}

export function paymentMethodLabel(
  method: PwaPaymentMethodDTO | null | undefined,
  locale: PwaLocale = 'IT',
): string {
  if (!method) return t(locale, 'common.notAvailable')
  const key = PAYMENT_METHOD_KEYS[method]
  return key ? t(locale, key) : method
}

export function profilePaymentOptions(locale: PwaLocale = 'IT') {
  return [
    {
      id: 'stripe' as const,
      title: t(locale, 'paymentMethod.stripe'),
      description: t(locale, 'paymentMethod.stripeDescription'),
    },
    {
      id: 'bank_transfer' as const,
      title: t(locale, 'paymentMethod.bankTransfer'),
      description: t(locale, 'paymentMethod.bankTransferDescription'),
    },
  ]
}

/** @deprecated use profilePaymentOptions(locale) */
export const PROFILE_PAYMENT_OPTIONS = profilePaymentOptions('IT')
