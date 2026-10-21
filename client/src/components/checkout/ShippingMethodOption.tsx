'use client'

import { formatMoney } from '@/lib/format'
import { useI18n } from '@/hooks/use-i18n'
import type { ShippingQuoteDTO } from '@/types/dto'
import { cn } from '@/utils/cn'
import { CarrierLogo } from './CarrierLogo'
import { CheckoutSelectableCard } from '@/components/checkout/stripe-ui/CheckoutStepPrimitives'

/** Frame logo corriere condiviso (opzioni reali + placeholder). */
export const SHIPPING_CARRIER_LOGO_FRAME =
  'flex h-12 w-[5.75rem] shrink-0 items-center justify-center rounded-[10px] bg-white p-1.5 sm:h-14 sm:w-[6.75rem] sm:p-2 dark:bg-idl-cream'

export const SHIPPING_CARRIER_LOGO = 'h-8 w-auto max-h-9 max-w-full sm:h-9'

type Props = {
  quote: ShippingQuoteDTO
  selected: boolean
  selecting?: boolean
  disabled?: boolean
  locked?: boolean
  onSelect: () => void
}

export function ShippingMethodOption({ quote, selected, selecting, disabled, locked, onSelect }: Props) {
  const { t, tParams } = useI18n()

  return (
    <CheckoutSelectableCard
      as="label"
      selected={selected || Boolean(selecting)}
      disabled={disabled || selecting}
      onSelect={onSelect}
    >
      <div className={cn('flex items-center gap-3.5 sm:gap-4', locked && 'opacity-55')}>
        <div className={SHIPPING_CARRIER_LOGO_FRAME}>
          <CarrierLogo
            carrierCode={quote.carrierCode}
            source={quote.source}
            className={SHIPPING_CARRIER_LOGO}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-idl-graphite">{quote.label}</p>
          {quote.etaDays != null ? (
            <p className="mt-0.5 text-[13px] text-idl-muted">
              {tParams('checkout.shipping.eta', { days: quote.etaDays })}
            </p>
          ) : null}
          {locked ? (
            <p className="mt-0.5 text-[12px] font-medium text-idl-muted">{t('checkout.shipping.paidLocked')}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-right text-[15px] font-bold tabular-nums text-idl-graphite">
          {quote.amountCents === 0 ? t('checkout.summary.free') : formatMoney(quote.amountCents, quote.currencyCode)}
        </p>
      </div>
    </CheckoutSelectableCard>
  )
}
