'use client'

import type { UserShippingAddressDTO } from '@/types/dto'
import { CheckoutSelectableCard } from '@/components/checkout/stripe-ui/CheckoutStepPrimitives'
import { formatShippingAddressCard } from '@/lib/shipping-addresses'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  addresses: readonly UserShippingAddressDTO[]
  selectedId: string | null
  onSelect: (id: string) => void
  disabled?: boolean
  extraOption?: { id: string; title: string; lines?: string }
}

export function ShippingAddressPicker({
  addresses,
  selectedId,
  onSelect,
  disabled,
  extraOption,
}: Props) {
  const { t } = useI18n()

  return (
    <div className="space-y-2.5">
      {addresses.map((address) => {
        const card = formatShippingAddressCard(address)
        return (
          <CheckoutSelectableCard
            key={address.id}
            selected={selectedId === address.id}
            disabled={disabled}
            onSelect={() => onSelect(address.id)}
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-idl-graphite">
                <span>{card.title}</span>
                {address.isDefault ? (
                  <span className="rounded-full bg-idl-tech-chip px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-idl-muted">
                    {t('account.addresses.default')}
                  </span>
                ) : null}
              </p>
              <p className={cn('mt-0.5 text-[12.5px] leading-relaxed text-idl-muted')}>{card.lines}</p>
            </div>
          </CheckoutSelectableCard>
        )
      })}
      {extraOption ? (
        <CheckoutSelectableCard
          selected={selectedId === extraOption.id}
          disabled={disabled}
          onSelect={() => onSelect(extraOption.id)}
        >
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-idl-graphite">{extraOption.title}</p>
            {extraOption.lines ? (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-idl-muted">{extraOption.lines}</p>
            ) : null}
          </div>
        </CheckoutSelectableCard>
      ) : null}
    </div>
  )
}
