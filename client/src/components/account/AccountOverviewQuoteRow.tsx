'use client'

import { Link } from '@/lib/navigation'
import { formatMoney } from '@/lib/format'
import {
  isQuotePayable,
  quoteDisplayReference,
  quoteStatusLabelKey,
  quoteStatusTone,
} from '@/lib/quote-payability'
import type { QuoteRequestDTO } from '@/types/dto'
import { AccountDcStatusPill } from '@/components/account/dc/AccountDcStatusPill'
import { QuoteStatusBadges } from '@/components/account/QuoteStatusBadges'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  quote: QuoteRequestDTO
  compact?: boolean
}

export function AccountOverviewQuoteRow({ quote, compact }: Props) {
  const { t } = useI18n()
  const label = quoteDisplayReference(quote)
  const payable = isQuotePayable(quote)

  return (
    <article className="overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-idl-tech-panel px-[18px] py-3.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            to={`/account/quotes/${quote.id}`}
            className="font-mono text-[12.5px] font-semibold text-idl-graphite no-underline hover:underline"
          >
            {label}
          </Link>
          <span className="text-[12.5px] text-idl-muted">
            {new Date(quote.createdAt).toLocaleDateString('it-IT')}
          </span>
          <AccountDcStatusPill
            label={t(quoteStatusLabelKey(quote.status))}
            tone={quoteStatusTone(quote.status)}
          />
          <QuoteStatusBadges quote={quote} />
        </div>
        <div className="flex items-center gap-4">
          {quote.estimatedTotal != null ? (
            <span className="text-sm font-extrabold text-idl-graphite">
              {formatMoney(quote.estimatedTotal, quote.currencyCode)}
            </span>
          ) : null}
          {!compact && payable ? (
            <Link
              to={`/checkout/quote/${quote.id}`}
              className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
            >
              {t('cart.quote.proceedCheckout')} →
            </Link>
          ) : (
            <Link
              to={`/account/quotes/${quote.id}`}
              className="text-[13px] font-bold text-idl-brass no-underline hover:underline"
            >
              {t('account.quotes.view')} →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
