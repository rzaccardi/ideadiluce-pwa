'use client'

import type { ReactNode } from 'react'
import type { CheckoutPaymentMethodDTO } from '@/features/checkout'
import { PaymentMethodOption } from '@/components/checkout/PaymentMethodOption'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'

const PAYMENT_OPTION_KEYS: Array<{
  id: CheckoutPaymentMethodDTO
  titleKey: MessageKey
  descriptionKey: MessageKey
}> = [
  {
    id: 'stripe',
    titleKey: 'paymentMethod.stripe',
    descriptionKey: 'paymentMethod.stripeDescription',
  },
  {
    id: 'bank_transfer',
    titleKey: 'paymentMethod.bankTransfer',
    descriptionKey: 'paymentMethod.bankTransferDescription',
  },
]

type Props = {
  selected: CheckoutPaymentMethodDTO
  disabled?: boolean
  stripeCardDetails?: ReactNode
  onSelect: (method: CheckoutPaymentMethodDTO) => void
}

export function CheckoutPaymentOptions({ selected, disabled, stripeCardDetails, onSelect }: Props) {
  const { t } = useI18n()

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {PAYMENT_OPTION_KEYS.map((option) => (
          <PaymentMethodOption
            key={option.id}
            id={option.id}
            title={t(option.titleKey)}
            description={t(option.descriptionKey)}
            selected={selected === option.id}
            disabled={disabled}
            onSelect={() => onSelect(option.id)}
          >
            {option.id === 'stripe' ? stripeCardDetails : null}
          </PaymentMethodOption>
        ))}
      </div>
    </section>
  )
}
