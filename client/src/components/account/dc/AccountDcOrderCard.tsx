'use client'

import { Link, useNavigate } from '@/lib/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { OrderDTO, OrderLineDTO } from '@/types/dto'
import { reorderOrder } from '@/features/orders'
import { formatMoney } from '@/lib/format'
import {
  formatOrderRef,
  orderStatusLabel,
  orderStatusTone,
} from '@/lib/orderLabels'
import type { PwaLocale } from '@/lib/locale'
import { SiteImage } from '@/components/site/SiteImage'
import { useI18n } from '@/hooks/use-i18n'
import { AccountDcStatusPill } from './AccountDcStatusPill'

function dateLocaleFor(locale: PwaLocale): string {
  if (locale === 'IT') return 'it-IT'
  if (locale === 'EN') return 'en-GB'
  if (locale === 'ES') return 'es-ES'
  if (locale === 'FR') return 'fr-FR'
  return 'de-DE'
}

function formatOrderDate(value: string, locale: PwaLocale) {
  return new Date(value).toLocaleDateString(dateLocaleFor(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Props = {
  order: OrderDTO
  lines?: readonly OrderLineDTO[]
  compact?: boolean
}

export function AccountDcOrderCard({ order, lines, compact = false }: Props) {
  const { t, tParams, locale } = useI18n()
  const navigate = useNavigate()
  const [reordering, setReordering] = useState(false)
  const total =
    order.totalAmount != null && order.currencyCode
      ? formatMoney(order.totalAmount, order.currencyCode)
      : '—'
  const statusLabel = orderStatusLabel(order.status, locale)
  const statusTone = orderStatusTone(order.status)
  const visibleLines = lines?.filter((line) => line.imageUrl).slice(0, 3) ?? []
  const extraCount = lines ? Math.max(0, lines.length - visibleLines.length) : 0
  const lineCountLabel =
    lines?.length != null ? tParams('account.orders.itemCount', { count: lines.length }) : null

  async function handleReorder() {
    if (!order.pwaOrderId) return
    setReordering(true)
    try {
      await reorderOrder(order.id)
      toast.success(t('orders.reorder.success'))
      navigate('/cart')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setReordering(false)
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-4 rounded-[11px] border border-idl-tech-border bg-idl-tech-panel p-4 sm:flex-row sm:items-center">
        {visibleLines[0]?.imageUrl ? (
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-idl-tech-panel">
            <SiteImage src={visibleLines[0].imageUrl} alt="" fill className="object-cover" sizes="56px" />
          </div>
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-idl-tech-panel text-xs font-bold text-idl-muted">
            {lines?.length ?? '·'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] text-[#8b919b]">
            {formatOrderRef(order.odooSaleOrderId, locale)}
            {lineCountLabel ? ` · ${lineCountLabel}` : null}
          </div>
          <div className="mt-0.5 text-[14.5px] font-bold text-idl-graphite">{statusLabel}</div>
        </div>
        <div className="text-right">
          <div className="text-[11.5px] text-[#8b919b]">{t('account.dashboard.delivery')}</div>
          <div className="text-[13.5px] font-bold text-idl-graphite">{t('account.dashboard.deliverySoon')}</div>
        </div>
        <AccountDcStatusPill label={statusLabel} tone={statusTone} />
      </div>
    )
  }

  return (
    <article className="overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededea] bg-idl-tech-panel px-[18px] py-3.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="font-mono text-[12.5px] font-semibold text-idl-graphite">
            {formatOrderRef(order.odooSaleOrderId, locale)}
          </span>
          <span className="text-[12.5px] text-idl-muted">{formatOrderDate(order.createdAt, locale)}</span>
          <AccountDcStatusPill label={statusLabel} tone={statusTone} />
        </div>
        <div className="flex items-center gap-[18px]">
          <span className="text-sm font-extrabold text-idl-graphite">{total}</span>
          <Link
            to={`/account/orders/${order.id}`}
            className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
          >
            {t('account.orders.track')}
          </Link>
          {order.pwaOrderId ? (
            <button
              type="button"
              disabled={reordering}
              onClick={() => void handleReorder()}
              className="text-[13px] font-bold text-idl-brass disabled:opacity-50"
            >
              {reordering ? t('account.orders.table.reordering') : t('account.orders.reorder')}
            </button>
          ) : null}
        </div>
      </div>
      {visibleLines.length > 0 ? (
        <div className="flex gap-2.5 px-[18px] py-3.5">
          {visibleLines.map((line) => (
            <div
              key={`${line.productRef}-${line.variantRef ?? ''}`}
              className="relative size-[46px] overflow-hidden rounded-[7px] bg-idl-tech-panel"
            >
              {line.imageUrl ? (
                <SiteImage src={line.imageUrl} alt="" fill className="object-cover" sizes="46px" />
              ) : null}
            </div>
          ))}
          {extraCount > 0 ? (
            <div className="flex size-[46px] items-center justify-center rounded-[7px] bg-[#f0f2f5] text-xs font-bold text-idl-muted">
              +{extraCount}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
