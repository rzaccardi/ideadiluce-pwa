'use client'

import { useEffect } from 'react'
import { Link, useNavigate, useParam } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { formatMoney } from '@/lib/format'
import { fetchQuoteDetail, quotesStore, startQuoteCheckout } from '@/features/quotes'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { AccountDcDetailRow } from '@/components/account/dc/AccountDcDetailRow'
import { AccountDcQuoteLines } from '@/components/account/dc/AccountDcQuoteLines'
import { AccountDcStatusPill } from '@/components/account/dc/AccountDcStatusPill'
import {
  QuotePayabilityNotice,
  QuoteStatusBadges,
  QuoteValidityHint,
} from '@/components/account/QuoteStatusBadges'
import { accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import {
  formatQuoteValidityDate,
  isQuotePayable,
  quoteDisplayReference,
  quoteStatusLabelKey,
  quoteStatusTone,
} from '@/lib/quote-payability'
import { OrderDetailSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'

export function AccountQuoteDetailPage() {
  const { t, tParams } = useI18n()
  const navigate = useNavigate()
  const quoteId = useParam('id')
  const quotes = useSnapshot(quotesStore)

  useEffect(() => {
    if (!quoteId) return
    void fetchQuoteDetail(quoteId)
  }, [quoteId])

  const detail = quotes.detail
  const payable = detail ? isQuotePayable(detail) : false
  const title = detail ? quoteDisplayReference(detail) : t('account.quotes.title')

  async function handlePay() {
    if (!quoteId) return
    try {
      const result = await startQuoteCheckout(quoteId)
      navigate(`/checkout?orderId=${encodeURIComponent(result.orderId)}`)
    } catch {
      /* error in store */
    }
  }

  const isLoading = quotes.isDetailLoading || !detail

  return (
    <div className="flex flex-col gap-[18px]">
      <AccountDcPanel
        title={title}
        action={
          <Link
            to="/account/quotes"
            className="text-[13px] font-bold text-[#d9831a] no-underline hover:underline"
          >
            ← {t('account.quotes.title')}
          </Link>
        }
      >
        {quotes.detailError ? <StripeErrorBanner message={quotes.detailError} /> : null}

        <PageLoadTransition isLoading={isLoading} skeleton={<OrderDetailSkeleton />}>
          {detail ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <AccountDcStatusPill
                  label={t(quoteStatusLabelKey(detail.status))}
                  tone={quoteStatusTone(detail.status)}
                />
                <QuoteStatusBadges quote={detail} />
              </div>

              <dl>
                <AccountDcDetailRow
                  label={t('account.orders.table.date')}
                  value={new Date(detail.createdAt).toLocaleDateString('it-IT')}
                />
                <AccountDcDetailRow
                  label={t('orders.detail.total')}
                  value={
                    detail.estimatedTotal != null
                      ? formatMoney(detail.estimatedTotal, detail.currencyCode)
                      : '—'
                  }
                />
                {detail.validityDate ? (
                  <AccountDcDetailRow
                    label={t('account.quotes.validUntil')}
                    value={formatQuoteValidityDate(detail.validityDate) ?? '—'}
                  />
                ) : null}
              </dl>

              <QuoteValidityHint quote={detail} />

              {detail.notes ? (
                <div className="rounded-[11px] border border-[#e7eaee] bg-[#f7f8fa] px-4 py-3 text-sm leading-relaxed text-[#5b616b]">
                  {detail.notes}
                </div>
              ) : null}

              {!payable ? <QuotePayabilityNotice quote={detail} /> : null}
            </div>
          ) : null}
        </PageLoadTransition>
      </AccountDcPanel>

      {detail && detail.lines.length > 0 ? (
        <AccountDcPanel title={t('account.quotes.linesTitle')}>
          <AccountDcQuoteLines
            lines={detail.lines}
            currencyCode={detail.currencyCode}
            tParams={tParams}
          />
        </AccountDcPanel>
      ) : null}

      {detail && payable ? (
        <button type="button" onClick={() => void handlePay()} className={accountDcPrimaryBtnClass}>
          {t('cart.quote.proceedCheckout')}
        </button>
      ) : null}

      {detail && !payable && (detail.expired || detail.payableReason === 'expired') ? (
        <Link to="/contatti" className={`inline-flex ${accountDcPrimaryBtnClass}`}>
          {t('account.quotes.expiredContact')}
        </Link>
      ) : null}

      {detail?.pwaOrderId && detail.status === 'converted' ? (
        <Link
          to={`/account/orders/pwa-${detail.pwaOrderId}`}
          className="text-[13px] font-bold text-[#d9831a] no-underline hover:underline"
        >
          {t('account.quotes.viewOrder')} →
        </Link>
      ) : null}
    </div>
  )
}
