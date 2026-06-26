'use client'

import { formatMoney } from '@/lib/format'
import { useI18n } from '@/hooks/use-i18n'
import type { ShippingQuoteDTO } from '@/types/dto'
import { CarrierLogo } from './CarrierLogo'
import { CheckoutSelectableCard } from '@/components/checkout/stripe-ui/CheckoutStepPrimitives'

type Props = {
  quote: ShippingQuoteDTO
  selected: boolean
  selecting?: boolean
  disabled?: boolean
  onSelect: () => void
}

export function ShippingMethodOption({ quote, selected, selecting, disabled, onSelect }: Props) {
  const { t, tParams } = useI18n()

  return (
    <CheckoutSelectableCard
      as="label"
      selected={selected || Boolean(selecting)}
      disabled={disabled || selecting}
      onSelect={onSelect}
    >
      <div className="flex items-center gap-3.5 sm:gap-4">
        <div className="flex size-[42px] shrink-0 items-center justify-center rounded-[9px] bg-[#eef7f1] p-1 sm:p-1.5">
          <CarrierLogo carrierCode={quote.carrierCode} source={quote.source} className="h-6 w-14 sm:h-7 sm:w-[4.5rem]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-[#14161b]">{quote.label}</p>
          {quote.etaDays != null ? (
            <p className="mt-0.5 text-[13px] text-[#6c727c]">
              {tParams('checkout.shipping.eta', { days: quote.etaDays })}
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-right text-[15px] font-bold tabular-nums text-[#14161b]">
          {selecting ? (
            <span className="text-sm font-normal text-[#6c727c]">…</span>
          ) : quote.amountCents === 0 ? (
            t('checkout.summary.free')
          ) : (
            formatMoney(quote.amountCents, quote.currencyCode)
          )}
        </p>
      </div>
    </CheckoutSelectableCard>
  )
}
