'use client'

import type { ShippingQuoteDTO } from '@/types/dto'
import { CarrierLogo } from '@/components/checkout/CarrierLogo'
import { ShippingMethodOption, SHIPPING_CARRIER_LOGO_FRAME, SHIPPING_CARRIER_LOGO } from '@/components/checkout/ShippingMethodOption'
import { filterVisibleShippingQuotes, isShippingQuoteSelectable } from '@/features/checkout/shipping-quotes'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import { cn } from '@/utils/cn'
import { CheckoutSelectableCard } from './CheckoutStepPrimitives'

type Props = {
  quotes: ReadonlyArray<ShippingQuoteDTO>
  selectedRef: string | null
  selectingRef: string | null
  loading: boolean
  blocked?: boolean
  blockedReason?: string
  selectionLocked?: boolean
  onSelect: (methodRef: string) => void
}

type PlaceholderItem = {
  id: string
  labelKey: MessageKey
  carrierCode: string
  source: string
}

/** Card con icone corrieri subito (prezzi «…» in fetch, «—» se indirizzo incompleto). */
function ShippingPlaceholderCards({ pricesPending }: { pricesPending?: boolean }) {
  const { t } = useI18n()
  const items: PlaceholderItem[] = [
    { id: 'free', labelKey: 'checkout.shipping.placeholder.free', carrierCode: 'internal', source: 'free' },
    { id: 'standard', labelKey: 'checkout.shipping.placeholder.standard', carrierCode: 'internal', source: 'flat' },
    { id: 'dhl', labelKey: 'checkout.shipping.placeholder.dhl', carrierCode: 'dhl', source: 'dhl' },
    { id: 'fedex', labelKey: 'checkout.shipping.placeholder.fedex', carrierCode: 'fedex', source: 'fedex' },
    { id: 'pickup', labelKey: 'checkout.shipping.placeholder.pickup', carrierCode: 'pickup', source: 'pickup' },
  ]

  return (
    <div className="flex flex-col gap-3" aria-hidden={!pricesPending}>
      {items.map((item) => (
        <CheckoutSelectableCard key={item.id} selected={false} disabled onSelect={() => {}}>
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className={SHIPPING_CARRIER_LOGO_FRAME} aria-hidden>
              <CarrierLogo
                carrierCode={item.carrierCode}
                source={item.source}
                className={SHIPPING_CARRIER_LOGO}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-idl-graphite">{t(item.labelKey)}</p>
            </div>
            <p className="shrink-0 text-right text-[15px] font-bold tabular-nums text-idl-muted">
              {pricesPending ? '…' : '—'}
            </p>
          </div>
        </CheckoutSelectableCard>
      ))}
    </div>
  )
}

export function CheckoutShippingOptions({
  quotes,
  selectedRef,
  selectingRef,
  loading,
  blocked = false,
  blockedReason,
  selectionLocked = false,
  onSelect,
}: Props) {
  const { t } = useI18n()
  const visibleQuotes = filterVisibleShippingQuotes(quotes)
  const showQuotes = visibleQuotes.length > 0
  // Nessuno skeleton: senza quote → placeholder con icone (idle se blocked, prezzi «…» durante fetch).
  const showPlaceholders = !showQuotes && (blocked || loading)
  const showBlockedAlert = blocked && Boolean(blockedReason)

  const selectionBusy = Boolean(selectingRef)

  return (
    <section aria-busy={loading || selectionBusy}>
      {showBlockedAlert ? (
        <p
          className="mb-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          role="alert"
        >
          {blockedReason}
        </p>
      ) : null}

      {showQuotes ? (
        <div className={cn('flex flex-col gap-3', (blocked || loading) && 'opacity-60')}>
          {visibleQuotes.map((q) => {
            const selectable = isShippingQuoteSelectable(q, selectionLocked)
            return (
              <ShippingMethodOption
                key={q.methodRef}
                quote={q}
                selected={selectedRef === q.methodRef}
                disabled={blocked || loading || !selectable}
                onSelect={() => {
                  if (!selectable) return
                  onSelect(q.methodRef)
                }}
              />
            )
          })}
        </div>
      ) : showPlaceholders ? (
        <div className={cn(blocked && !loading && 'opacity-50')}>
          <ShippingPlaceholderCards pricesPending={loading && !blocked} />
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {t('checkout.shipping.noMethods')}
        </p>
      )}
    </section>
  )
}
