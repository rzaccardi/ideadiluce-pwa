'use client'

import { Link } from '@/lib/navigation'
import type { OrderDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import {
  formatOrderRef,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/orderLabels'
import type { PwaLocale } from '@/lib/locale'
import { ORDER_SOURCE_LABEL } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import { AccountStatusBadge } from './AccountStatusBadge'
import { cn } from '@/utils/cn'

function dateLocaleFor(locale: PwaLocale): string {
  if (locale === 'IT') return 'it-IT'
  if (locale === 'EN') return 'en-GB'
  if (locale === 'ES') return 'es-ES'
  if (locale === 'FR') return 'fr-FR'
  return 'de-DE'
}

function ChevronIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-zinc-400">
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AccountOrderRow({ order, className }: { order: OrderDTO; className?: string }) {
  const { locale } = useI18n()
  const date = new Date(order.createdAt).toLocaleDateString(dateLocaleFor(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const total =
    order.totalAmount != null && order.currencyCode
      ? formatMoney(order.totalAmount, order.currencyCode)
      : null

  return (
    <Link
      to={`/account/orders/${order.id}`}
      className={cn(
        'group flex items-center gap-4 rounded-md border border-zinc-200 bg-white px-4 py-3.5 transition',
        'hover:border-zinc-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-medium text-zinc-900">{formatOrderRef(order.odooSaleOrderId, locale)}</p>
          <AccountStatusBadge label={orderStatusLabel(order.status, locale)} tone={orderStatusTone(order.status)} />
          {order.paymentStatus ? (
            <AccountStatusBadge
              label={paymentStatusLabel(order.paymentStatus, locale)}
              tone={paymentStatusTone(order.paymentStatus)}
            />
          ) : null}
          {order.source !== 'pwa' ? (
            <AccountStatusBadge
              label={order.sourceLabel || ORDER_SOURCE_LABEL[order.source]}
              tone="neutral"
            />
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500">{date}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {total ? <span className="text-sm font-medium tabular-nums text-zinc-900">{total}</span> : null}
        <ChevronIcon />
      </div>
    </Link>
  )
}
