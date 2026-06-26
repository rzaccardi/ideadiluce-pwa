'use client'

import type { ShippingQuoteDTO } from '@/types/dto'
import { ShippingMethodOption } from '@/components/checkout/ShippingMethodOption'
import { isShippingQuoteSelectable } from '@/features/checkout/shipping-quotes'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  quotes: ReadonlyArray<ShippingQuoteDTO>
  selectedRef: string | null
  selectingRef: string | null
  loading: boolean
  blocked?: boolean
  selectionLocked?: boolean
  onSelect: (methodRef: string) => void
}

function ShippingPlaceholderCards() {
  return (
    <div className="space-y-3" aria-hidden>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="flex h-[76px] items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
        >
          <div className="h-10 w-[4.5rem] shrink-0 rounded-lg bg-zinc-200/80" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/3 max-w-[12rem] rounded bg-zinc-200/80" />
            <div className="h-3 w-1/2 max-w-[9rem] rounded bg-zinc-100" />
          </div>
          <div className="h-4 w-14 shrink-0 rounded bg-zinc-200/80" />
        </div>
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
  selectionLocked = false,
  onSelect,
}: Props) {
  const { t } = useI18n()
  const showQuotes = quotes.length > 0
  const showLoading = loading && !showQuotes
  const showBlockedPlaceholders = blocked && !showQuotes && !showLoading

  const selectionBusy = Boolean(selectingRef)

  return (
    <section className={cn((blocked || selectionBusy) && 'pointer-events-none')}>
      {blocked ? (
        <p className="mb-3 text-sm text-[#6c727c]">{t('checkout.shipping.addressIncomplete')}</p>
      ) : null}

      {showLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse rounded-xl border border-zinc-200 bg-zinc-50"
            />
          ))}
        </div>
      ) : showQuotes ? (
        <div className={cn('flex flex-col gap-3', (blocked || selectionBusy) && 'opacity-60')}>
          {quotes.map((q) => {
            const selectable = isShippingQuoteSelectable(q, selectionLocked)
            return (
              <ShippingMethodOption
                key={q.methodRef}
                quote={q}
                selected={selectedRef === q.methodRef || selectingRef === q.methodRef}
                selecting={selectingRef === q.methodRef}
                disabled={blocked || loading || selectionBusy || !selectable}
                onSelect={() => {
                  if (!selectable || selectionBusy) return
                  onSelect(q.methodRef)
                }}
              />
            )
          })}
        </div>
      ) : showBlockedPlaceholders ? (
        <div className="opacity-50">
          <ShippingPlaceholderCards />
        </div>
      ) : (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          {t('checkout.shipping.noMethods')}
        </p>
      )}
    </section>
  )
}
