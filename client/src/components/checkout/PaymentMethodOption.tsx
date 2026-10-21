import type { ReactNode } from 'react'
import type { PwaPaymentMethodDTO } from '@/types/dto'
import { PaymentBrandIcons } from './PaymentBrandIcons'
import { CheckoutSelectableCard } from '@/components/checkout/stripe-ui/CheckoutStepPrimitives'

type Props = {
  id: PwaPaymentMethodDTO
  title: string
  description: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  children?: ReactNode
}

/**
 * Header radio in `<label>`; dettagli Stripe (Express Checkout / Payment Element)
 * fuori dal label e montati solo se selezionati — evita display:none e click
 * intercettati dal radio che rompono Apple Pay / Google Pay / PayPal.
 */
export function PaymentMethodOption({
  id,
  title,
  description,
  selected,
  disabled,
  onSelect,
  children,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <CheckoutSelectableCard as="label" selected={selected} disabled={disabled} onSelect={onSelect}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[15px] font-bold text-idl-graphite">{title}</span>
              {id === 'bank_transfer' ? null : <PaymentBrandIcons method={id} />}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-idl-muted">{description}</p>
          </div>
        </div>
      </CheckoutSelectableCard>

      {children && selected ? (
        <div className="rounded-xl border border-idl-tech-border bg-idl-tech-panel p-4">{children}</div>
      ) : null}
    </div>
  )
}
