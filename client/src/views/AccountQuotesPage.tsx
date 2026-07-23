'use client'

import { useEffect } from 'react'
import { Link } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { formatMoney } from '@/lib/format'
import { fetchQuotesList, quotesStore } from '@/features/quotes'
import { AccountDcPanel } from '@/components/account/dc/AccountDcPanel'
import { AccountDcStatusPill } from '@/components/account/dc/AccountDcStatusPill'
import {
  QuotePayabilityNotice,
  QuoteStatusBadges,
  QuoteValidityHint,
} from '@/components/account/QuoteStatusBadges'
import { accountDcPrimaryBtnClass } from '@/components/account/dc/account-dc-styles'
import {
  isQuotePayable,
  quoteDisplayReference,
  quoteStatusLabelKey,
  quoteStatusTone,
} from '@/lib/quote-payability'
import { ListSkeleton } from '@/components/Skeleton'
import { PageLoadTransition } from '@/components/motion'
import { StripeErrorBanner } from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'

export function AccountQuotesPage() {
  const { t } = useI18n()
  const quotes = useSnapshot(quotesStore)

  useEffect(() => {
    void fetchQuotesList()
  }, [])

  const isLoading = quotes.isListLoading || quotes.list === null

  return (
    <AccountDcPanel title={t('account.quotes.title')} description={t('account.quotes.description')}>
      {quotes.listError ? <StripeErrorBanner message={quotes.listError} /> : null}

      <PageLoadTransition isLoading={isLoading} skeleton={<ListSkeleton />}>
        {quotes.list && quotes.list.length === 0 ? (
          <p className="py-8 text-center text-sm text-idl-muted">{t('account.quotes.empty')}</p>
        ) : null}

        {quotes.list && quotes.list.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {quotes.list.map((q) => {
              const payable = isQuotePayable(q)
              const label = quoteDisplayReference(q)

              return (
                <article key={q.id} className="overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededea] bg-idl-tech-panel px-[18px] py-3.5">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <Link
                        to={`/account/quotes/${q.id}`}
                        className="font-mono text-[12.5px] font-semibold text-idl-graphite no-underline hover:underline"
                      >
                        {label}
                      </Link>
                      <span className="text-[12.5px] text-idl-muted">
                        {new Date(q.createdAt).toLocaleDateString('it-IT')}
                      </span>
                      <AccountDcStatusPill
                        label={t(quoteStatusLabelKey(q.status))}
                        tone={quoteStatusTone(q.status)}
                      />
                      <QuoteStatusBadges quote={q} />
                    </div>
                    <div className="flex items-center gap-[18px]">
                      {q.estimatedTotal != null ? (
                        <span className="text-sm font-extrabold text-idl-graphite">
                          {formatMoney(q.estimatedTotal, q.currencyCode)}
                        </span>
                      ) : null}
                      <Link
                        to={`/account/quotes/${q.id}`}
                        className="text-[13px] font-bold text-[#0c0c0d] no-underline hover:underline"
                      >
                        {t('account.quotes.view')} →
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-2 px-[18px] py-3">
                    <QuoteValidityHint quote={q} />
                    {payable ? (
                      <Link
                        to={`/checkout/quote/${q.id}`}
                        className={`inline-flex ${accountDcPrimaryBtnClass} !py-2 !text-xs`}
                      >
                        {t('cart.quote.proceedCheckout')}
                      </Link>
                    ) : (
                      <QuotePayabilityNotice quote={q} className="!py-2 !text-xs" />
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </PageLoadTransition>
    </AccountDcPanel>
  )
}
