'use client'

import { Link } from '@/lib/navigation'
import { checkoutActionControlClass } from '@/components/checkout/stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

const primaryActionClass = cn(
  'inline-flex w-full items-center justify-center rounded-xl bg-[#14161b] px-4 py-4',
  'text-base font-extrabold text-white transition hover:bg-[#2a2d35]',
  checkoutActionControlClass,
)

const secondaryActionClass = cn(
  'inline-flex w-full items-center justify-center rounded-xl border border-idl-tech-border bg-idl-tech-panel',
  'px-4 py-4 text-base font-extrabold text-idl-graphite transition hover:border-[#14161b]',
  checkoutActionControlClass,
)

export function QuoteSuccessStep() {
  const { t } = useI18n()

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-[#d1e7dd] bg-[#f4fbf7] px-5 py-6 text-center sm:px-6">
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#198754]/10 text-[#198754]"
          aria-hidden
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6 9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="mt-4 text-sm font-semibold text-idl-graphite">{t('cart.quote.success')}</p>
        <p className="mt-2 text-sm leading-relaxed text-idl-muted">{t('cart.quote.successPending')}</p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Link to="/account/quotes" className={cn('min-w-0 flex-1', primaryActionClass)}>
          {t('account.quotes.title')}
        </Link>
        <Link to="/cart" className={cn('min-w-0 flex-1', secondaryActionClass)}>
          {t('cart.quote.backToCart')}
        </Link>
      </div>
    </section>
  )
}
