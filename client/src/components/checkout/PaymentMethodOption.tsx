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
}

export function PaymentMethodOption({ id, title, description, selected, disabled, onSelect }: Props) {
  return (
    <CheckoutSelectableCard as="label" selected={selected} disabled={disabled} onSelect={onSelect}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[15px] font-bold text-[#14161b]">{title}</span>
            <PaymentBrandIcons method={id} />
          </div>
          <p className="mt-1 text-[13px] leading-snug text-[#6c727c]">{description}</p>
        </div>
      </div>
    </CheckoutSelectableCard>
  )
}
