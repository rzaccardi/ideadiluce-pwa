'use client'

import { useEffect, useMemo } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import {
  fetchOrderDetail,
  fetchOrdersList,
  ordersStore,
} from '@/features/orders'
import { authStore } from '@/features/auth'
import { fetchInvoicesList, invoicesStore } from '@/features/invoices'
import {
  fetchMyProfessionalRequest,
  isProfessionalRequestPending,
  professionalRequestStore,
} from '@/features/professional-request'
import { fetchQuotesList, quotesStore } from '@/features/quotes'
import { fetchWishlist, wishlistStore } from '@/features/wishlist'
import { useI18n } from '@/hooks/use-i18n'
import { AccountDcOrderCard } from '@/components/account/dc/AccountDcOrderCard'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { AccountDcStatCard } from '@/components/account/dc/AccountDcStatCard'
import { AccountOverviewInvoiceRow } from '@/components/account/AccountOverviewInvoiceRow'
import { AccountOverviewQuoteRow } from '@/components/account/AccountOverviewQuoteRow'
import { accountDcPrimaryBtnClass, accountDcPromoClass } from '@/components/account/dc/account-dc-styles'
import { ListSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { isQuotePayable } from '@/lib/quote-payability'

const IN_PROGRESS_STATUSES = new Set([
  'payment_pending',
  'payment_started',
  'paid',
  'confirmed',
  'checkout_started',
])

function isOrderInProgress(status: string) {
  const key = status.toLowerCase()
  return IN_PROGRESS_STATUSES.has(key)
}

function isProfessionalActive(me: NonNullable<typeof authStore.me>) {
  return me.isProfessional || me.customerSegment === 'professional'
}

function segmentLabel(
  me: NonNullable<typeof authStore.me>,
  t: ReturnType<typeof useI18n>['t'],
): string | null {
  if (isProfessionalActive(me)) return t('account.overview.segmentProfessional')
  if (me.customerSegment === 'business') return t('account.overview.segmentB2b')
  return t('account.overview.segmentB2c')
}

export function AccountOverviewPage() {
  const { t, tParams } = useI18n()
  const auth = useSnapshot(authStore)
  const orders = useSnapshot(ordersStore)
  const quotes = useSnapshot(quotesStore)
  const invoices = useSnapshot(invoicesStore)
  const wishlist = useSnapshot(wishlistStore)
  const professionalRequest = useSnapshot(professionalRequestStore)

  useEffect(() => {
    void fetchOrdersList()
    void fetchWishlist()
    void fetchQuotesList()
    void fetchInvoicesList()
  }, [])

  useEffect(() => {
    if (auth.me && !isProfessionalActive(auth.me)) {
      void fetchMyProfessionalRequest()
    }
  }, [auth.me?.id, auth.me?.isProfessional, auth.me?.customerSegment])

  const orderList = orders.list ?? []
  const quoteList = quotes.list ?? []
  const invoiceList = invoices.list ?? []
  const inProgressCount = orderList.filter((o) => isOrderInProgress(o.status)).length
  const payableQuotesCount = quoteList.filter((q) => isQuotePayable(q)).length
  const ongoingOrder = orderList.find((o) => isOrderInProgress(o.status)) ?? null

  useEffect(() => {
    if (ongoingOrder) {
      void fetchOrderDetail(ongoingOrder.id)
    }
  }, [ongoingOrder?.id])

  const ongoingDetail =
    ongoingOrder && orders.detail?.id === ongoingOrder.id ? orders.detail : null
  const recentOrders = orderList.slice(0, 3)
  const recentQuotes = quoteList.slice(0, 3)
  const recentInvoices = invoiceList.slice(0, 3)

  const savedPartsCount = useMemo(() => wishlist.items.length, [wishlist.items.length])

  const requestStatus = professionalRequest.summary?.status
  const requestPending = isProfessionalRequestPending(requestStatus)
  const requestRejected =
    requestStatus?.toUpperCase() === 'REJECTED' || requestStatus === 'rejected'

  const segment = auth.me ? segmentLabel(auth.me, t) : null

  return (
    <div className="flex flex-col gap-[18px]">
      {auth.me && isProfessionalActive(auth.me) ? (
        <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p>{t('account.overview.professionalActive')}</p>
          {auth.me.companyName ? (
            <p className="mt-1 text-xs text-emerald-900/80">{auth.me.companyName}</p>
          ) : null}
        </div>
      ) : requestPending ? (
        <p className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t('account.overview.professionalPending')}
        </p>
      ) : requestRejected ? (
        <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <p>{t('account.overview.professionalRejected')}</p>
          <Link to="/professionisti" className={`mt-4 inline-flex ${accountDcPrimaryBtnClass}`}>
            {t('account.overview.professionalCtaLink')}
          </Link>
        </div>
      ) : !auth.me?.isProfessional ? (
        <div className={accountDcPromoClass}>
          <div>
            <p className="text-base font-extrabold text-idl-graphite">{t('account.overview.professionalCta')}</p>
          </div>
          <Link to="/professionisti" className={accountDcPrimaryBtnClass}>
            {t('account.overview.professionalCtaLink')}
          </Link>
        </div>
      ) : null}

      {segment ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9298a3]">
          {t('account.overview.accountType')} {segment}
        </p>
      ) : null}

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-5">
        <AccountDcStatCard value={orderList.length} label={t('account.dashboard.totalOrders')} />
        <AccountDcStatCard value={inProgressCount} label={t('account.dashboard.inProgress')} />
        <AccountDcStatCard value={savedPartsCount} label={t('account.dashboard.savedParts')} />
        <AccountDcStatCard value={quoteList.length} label={t('account.dashboard.openQuotes')} />
        <AccountDcStatCard value={invoiceList.length} label={t('account.dashboard.invoices')} />
      </div>

      {payableQuotesCount > 0 ? (
        <p className="rounded-[14px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          {tParams('account.overview.payableQuotesHint', { count: payableQuotesCount })}
        </p>
      ) : null}

      {ongoingOrder ? (
        <AccountDcPanel
          title={t('account.dashboard.ongoingOrder')}
          action={
            <Link
              to={`/account/orders/${ongoingOrder.id}`}
              className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
            >
              {t('account.dashboard.details')}
            </Link>
          }
        >
          <AccountDcOrderCard order={ongoingOrder} lines={ongoingDetail?.lines} compact />
        </AccountDcPanel>
      ) : null}

      <AccountDcPanel
        title={t('account.overview.recentQuotes')}
        action={
          quoteList.length > 0 ? (
            <Link
              to="/account/quotes"
              className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
            >
              {t('account.overview.viewAllQuotes')} →
            </Link>
          ) : null
        }
      >
        {quotes.listError ? <StripeErrorBanner message={quotes.listError} /> : null}
        <PageLoadTransition
          isLoading={quotes.isListLoading || quotes.list === null}
          skeleton={<ListSkeleton count={2} />}
        >
          {recentQuotes.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {recentQuotes.map((quote) => (
                <AccountOverviewQuoteRow key={quote.id} quote={quote} compact />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-idl-muted">{t('account.overview.noQuotes')}</p>
              <Link to="/cart" className={`mt-4 inline-flex ${accountDcPrimaryBtnClass}`}>
                {t('cart.quoteCta')}
              </Link>
            </div>
          )}
        </PageLoadTransition>
      </AccountDcPanel>

      <AccountDcPanel
        title={t('account.overview.recentInvoices')}
        action={
          invoiceList.length > 0 ? (
            <Link
              to="/account/invoices"
              className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
            >
              {t('account.overview.viewAllInvoices')} →
            </Link>
          ) : null
        }
      >
        {invoices.listError ? <StripeErrorBanner message={invoices.listError} /> : null}
        <PageLoadTransition
          isLoading={invoices.isListLoading || invoices.list === null}
          skeleton={<ListSkeleton count={2} />}
        >
          {recentInvoices.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {recentInvoices.map((invoice) => (
                <AccountOverviewInvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-idl-muted">{t('account.overview.noInvoices')}</p>
          )}
        </PageLoadTransition>
      </AccountDcPanel>

      <div className={accountDcPromoClass}>
        <div>
          <div className="mb-1.5 text-base font-extrabold text-idl-graphite">
            {t('account.dashboard.reorderParts')}
          </div>
          <p className="max-w-xl text-[13.5px] leading-relaxed text-[#6b6b70]">
            {t('account.dashboard.reorderPartsBody')}
          </p>
        </div>
        <Link to="/account/wishlist" className={accountDcPrimaryBtnClass}>
          {t('account.dashboard.goToParts')}
        </Link>
      </div>

      {orders.listError ? <StripeErrorBanner message={orders.listError} /> : null}

      <PageLoadTransition
        isLoading={orders.isListLoading || orders.list === null}
        skeleton={<ListSkeleton />}
      >
        {recentOrders.length > 0 ? (
          <AccountDcPanel
            title={t('account.overview.recentOrders')}
            action={
              orderList.length > 0 ? (
                <Link
                  to="/account/orders"
                  className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
                >
                  {t('account.overview.myOrders')} →
                </Link>
              ) : null
            }
          >
            <div className="flex flex-col gap-3.5">
              {recentOrders.map((order) => (
                <AccountDcOrderCard key={order.id} order={order} />
              ))}
            </div>
          </AccountDcPanel>
        ) : null}

        {orderList.length === 0 ? (
          <AccountDcPanel title={t('account.overview.recentOrders')}>
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-idl-graphite">{t('account.overview.noOrders')}</p>
              <Link to="/negozio" className={`mt-6 inline-flex ${accountDcPrimaryBtnClass}`}>
                {t('account.overview.browseCatalog')}
              </Link>
            </div>
          </AccountDcPanel>
        ) : null}
      </PageLoadTransition>
    </div>
  )
}
