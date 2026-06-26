'use client'

import { Link, useNavigate } from '@/lib/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { OrderDTO } from '@/types/dto'
import { reorderOrder } from '@/features/orders'
import { formatMoney } from '@/lib/format'
import {
  formatOrderRef,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/orderLabels'
import type { PwaLocale } from '@/lib/locale'
import { useI18n } from '@/hooks/use-i18n'
import { AccountStatusBadge } from './AccountStatusBadge'

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

export function AccountOrdersTable({ orders }: { orders: readonly OrderDTO[] }) {
  const { t, locale } = useI18n()
  const navigate = useNavigate()
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  async function handleReorder(orderId: string) {
    setReorderingId(orderId)
    try {
      await reorderOrder(orderId)
      toast.success(t('orders.reorder.success'))
      navigate('/cart')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setReorderingId(null)
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-zinc-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80">
            <th scope="col" className="px-4 py-3 font-medium text-zinc-900">
              {t('account.orders.table.order')}
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-zinc-900">
              {t('account.orders.table.date')}
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-zinc-900">
              {t('account.orders.table.status')}
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-zinc-900">
              {t('orders.detail.paymentStatus')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-900">
              {t('account.orders.table.total')}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-zinc-900">
              {t('account.orders.table.detail')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((order) => {
            const total =
              order.totalAmount != null && order.currencyCode
                ? formatMoney(order.totalAmount, order.currencyCode)
                : '—'

            return (
              <tr key={order.id} className="transition hover:bg-zinc-50/80">
                <td className="px-4 py-3.5 font-medium text-zinc-900">
                  {formatOrderRef(order.odooSaleOrderId, locale)}
                </td>
                <td className="px-4 py-3.5 text-zinc-600">{formatOrderDate(order.createdAt, locale)}</td>
                <td className="px-4 py-3.5">
                  <AccountStatusBadge
                    label={orderStatusLabel(order.status, locale)}
                    tone={orderStatusTone(order.status)}
                  />
                </td>
                <td className="px-4 py-3.5">
                  {order.paymentStatus ? (
                    <AccountStatusBadge
                      label={paymentStatusLabel(order.paymentStatus, locale)}
                      tone={paymentStatusTone(order.paymentStatus)}
                    />
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-medium tabular-nums text-zinc-900">
                  {total}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900"
                    >
                      {t('account.orders.table.detail')}
                    </Link>
                    {order.pwaOrderId ? (
                      <button
                        type="button"
                        disabled={reorderingId === order.id}
                        onClick={() => void handleReorder(order.id)}
                        className="text-sm text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 disabled:opacity-50"
                      >
                        {reorderingId === order.id
                          ? t('account.orders.table.reordering')
                          : t('account.orders.table.reorder')}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
