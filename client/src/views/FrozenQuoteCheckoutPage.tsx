'use client'

import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from '@/lib/navigation'
import { startQuoteCheckout } from '@/features/quotes'
import { resumeFrozenQuoteCheckout } from '@/features/checkout'
import { PageHeader } from '@/components/PageHeader'
import { useI18n } from '@/hooks/use-i18n'
import { ApiRequestError } from '@/types/api'

function frozenQuoteErrorMessage(err: unknown, t: ReturnType<typeof useI18n>['t']): string {
  if (err instanceof ApiRequestError) {
    const code = err.code
    if (code === 'QUOTE_EXPIRED') return t('account.quotes.message.expired')
    if (code === 'QUOTE_CANCELLED') return t('account.quotes.message.cancelled')
    if (code === 'QUOTE_CONVERTED') return t('account.quotes.message.converted')
    if (code === 'QUOTE_DRAFT') return t('account.quotes.message.draft')
    if (code === 'QUOTE_NOT_PAYABLE') return t('account.quotes.message.notPayable')
    if (err.userMessage) return err.userMessage
  }
  return t('cart.quote.checkoutFailed')
}

export function FrozenQuoteCheckoutPage() {
  const { t } = useI18n()
  const params = useParams<{ id: string }>()
  const navigate = useNavigate()
  const quoteId = params.id
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quoteId) return
    void (async () => {
      try {
        const result = await startQuoteCheckout(quoteId)
        await resumeFrozenQuoteCheckout(result.orderId)
        navigate(`/checkout?orderId=${encodeURIComponent(result.orderId)}`)
      } catch (err) {
        setError(frozenQuoteErrorMessage(err, t))
      }
    })()
  }, [quoteId, navigate, t])

  if (error) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
        <PageHeader title={t('cart.quote.frozenTitle')} description={t('cart.quote.frozenDescription')} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
        <Link
          to="/account/quotes"
          className="inline-flex text-sm font-semibold text-[#d9831a] no-underline hover:underline"
        >
          ← {t('account.quotes.title')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('checkout.frozenQuote.title')} description={t('checkout.frozenQuote.loading')} />
    </div>
  )
}
