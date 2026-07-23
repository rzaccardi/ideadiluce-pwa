'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from '@/lib/link-title'
import { Link, useNavigate, useParam } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { toast } from 'sonner'
import {
  fetchOrderDetail,
  fetchOrderRecommendations,
  ordersStore,
  reorderOrder,
  resetOrderDetail,
} from '@/features/orders'
import { formatMoney } from '@/lib/format'
import {
  formatOrderRef,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/orderLabels'
import type { PwaLocale } from '@/lib/locale'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { AccountDcDetailRow } from '@/components/account/dc/AccountDcDetailRow'
import { AccountDcOrderLines } from '@/components/account/dc/AccountDcOrderLines'
import { AccountDcOrderTracker } from '@/components/account/dc/AccountDcOrderTracker'
import { AccountDcStatusPill } from '@/components/account/dc/AccountDcStatusPill'
import {
  accountDcOutlineBtnClass,
  accountDcPrimaryBtnClass,
} from '@/components/account/dc/account-dc-styles'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { OrderDetailSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { ProductSlider } from '@/components/product/ProductSlider'
import { useI18n } from '@/hooks/use-i18n'

const LOCALE_DATE: Record<PwaLocale, string> = {
  IT: 'it-IT',
  EN: 'en-GB',
  ES: 'es-ES',
  FR: 'fr-FR',
  DE: 'de-DE',
}

export function OrderDetailPage() {
  const { locale, t, tParams } = useI18n()
  const id = useParam('id')
  const navigate = useNavigate()
  const orders = useSnapshot(ordersStore)
  const [reordering, setReordering] = useState(false)

  useEffect(() => {
    if (id) {
      void fetchOrderDetail(id)
      void fetchOrderRecommendations(id)
    }
    return () => {
      resetOrderDetail()
    }
  }, [id])

  const isCurrentDetail = orders.detail?.id === id
  const isLoading = orders.isDetailLoading || (!isCurrentDetail && !orders.detailError)

  async function handleReorder() {
    if (!id) return
    setReordering(true)
    try {
      const result = await reorderOrder(id)
      toast.success(t('orders.reorder.success'))
      if (result.skipped.length > 0) {
        toast.message(t('orders.reorder.error'))
      }
      navigate('/cart')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setReordering(false)
    }
  }

  if (orders.detailError && orders.detailId === id) {
    return (
      <AccountDcPanel title={t('orders.detail.loading')}>
        <StripeErrorBanner message={orders.detailError} />
        <Link to="/account/orders" className={`mt-5 inline-flex ${accountDcOutlineBtnClass}`}>
          {t('orders.detail.back')}
        </Link>
      </AccountDcPanel>
    )
  }

  if (isLoading || !isCurrentDetail || !orders.detail) {
    return (
      <AccountDcPanel title={t('orders.detail.loading')}>
        <PageLoadTransition isLoading skeleton={<OrderDetailSkeleton />}>
          {null}
        </PageLoadTransition>
      </AccountDcPanel>
    )
  }

  const order = orders.detail
  const orderRef = formatOrderRef(order.odooSaleOrderId, locale)
  const total =
    order.totalAmount != null && order.currencyCode
      ? formatMoney(order.totalAmount, order.currencyCode)
      : t('common.notAvailable')
  const orderDate = new Date(order.createdAt).toLocaleString(LOCALE_DATE[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex flex-col gap-[18px]">
      <AccountDcPanel
        title={orderRef}
        action={
          <Link
            to="/account/orders"
            className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
          >
            ← {t('orders.detail.back')}
          </Link>
        }
        description={orderDate}
      >
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <AccountDcStatusPill
            label={orderStatusLabel(order.status, locale)}
            tone={orderStatusTone(order.status)}
          />
          {order.paymentStatus ? (
            <AccountDcStatusPill
              label={paymentStatusLabel(order.paymentStatus, locale)}
              tone={paymentStatusTone(order.paymentStatus)}
            />
          ) : null}
          {order.pwaOrderId ? (
            <button
              type="button"
              disabled={reordering}
              onClick={() => void handleReorder()}
              className={`${accountDcPrimaryBtnClass} !py-2 !text-xs disabled:opacity-60`}
            >
              {reordering ? t('account.orders.table.reordering') : t('orders.detail.reorder')}
            </button>
          ) : null}
        </div>

        <AccountDcOrderTracker order={{ ...order, lines: [...order.lines] }} t={t} />
      </AccountDcPanel>

      {order.lines.length > 0 ? (
        <AccountDcPanel title={t('orders.detail.items')}>
          <AccountDcOrderLines
            lines={order.lines}
            currencyCode={order.currencyCode}
            t={t}
            tParams={tParams}
          />
        </AccountDcPanel>
      ) : null}

      <AccountDcPanel title={t('thankYou.summary.title')}>
        <dl>
          <AccountDcDetailRow
            label={t('orders.detail.orderStatus')}
            value={orderStatusLabel(order.status, locale)}
          />
          <AccountDcDetailRow
            label={t('orders.detail.paymentStatus')}
            value={paymentStatusLabel(order.paymentStatus, locale)}
          />
          <AccountDcDetailRow label={t('orders.detail.total')} value={total} />
          <AccountDcDetailRow label={t('orders.detail.date')} value={orderDate} />
          {order.pwaOrderId ? (
            <AccountDcDetailRow label={t('orders.detail.pwaRef')} value={order.pwaOrderId} />
          ) : null}
        </dl>
      </AccountDcPanel>

      {order.isSingleItem && orders.recommendations.length > 0 ? (
        <AccountDcPanel title={t('orders.detail.completeOrder')}>
          <ProductSlider variant="contained" products={orders.recommendations} />
        </AccountDcPanel>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {order.odooPortalUrl ? (
          <ExternalLink
            href={order.odooPortalUrl}
            target="_blank"
            rel="noreferrer"
            className={accountDcPrimaryBtnClass}
          >
            {t('orders.detail.invoicePortal')}
          </ExternalLink>
        ) : (
          <p className="w-full text-sm text-[#6c727c]">{t('paymentResult.syncNote')}</p>
        )}
        <Link to="/account/orders" className={accountDcOutlineBtnClass}>
          {t('orders.detail.back')}
        </Link>
        {!order.odooPortalUrl ? (
          <Link to="/negozio" className={accountDcOutlineBtnClass}>
            {t('paymentResult.catalog')}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
