'use client'

import { Link } from '@/lib/navigation'
import { formatMoney } from '@/lib/format'
import { useI18n } from '@/hooks/use-i18n'
import { preloadStripe } from '@/lib/stripe-loader'
import { SectionContainer } from '@/components/site/primitives'
import { Button } from '@/components/Button'
import { cn } from '@/utils/cn'

type Props = {
  totalCents: number
  currencyCode: string
  checkoutDisabled?: boolean
  noPurchasableLines?: boolean
  hasBlockedLines?: boolean
}

export function CartCheckoutStickyBar({
  totalCents,
  currencyCode,
  checkoutDisabled,
  noPurchasableLines,
  hasBlockedLines,
}: Props) {
  const { t } = useI18n()

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-idl-tech-border bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden',
      )}
    >
      <SectionContainer className="flex items-center gap-3 py-3">
        <div className="min-w-0 shrink-0">
          <div className="text-[11px] font-medium text-idl-muted">{t('cart.summary.total')}</div>
          <div className="text-lg font-extrabold leading-tight text-idl-graphite">
            {formatMoney(totalCents, currencyCode)}
          </div>
        </div>

        {checkoutDisabled ? (
          <div className="min-w-0 flex-1 text-right text-xs font-medium text-amber-800">
            {noPurchasableLines
              ? t('cart.unpurchasable.noPurchasableLines')
              : hasBlockedLines
                ? t('cart.unpurchasable.blockedCheckout')
                : t('cart.stock.insufficient')}
          </div>
        ) : (
          <Link
            to="/checkout"
            className="min-w-0 flex-1"
            onMouseEnter={() => preloadStripe()}
            onFocus={() => preloadStripe()}
          >
            <Button
              variant="technical"
              className="h-auto w-full rounded-[10px] px-4 py-3.5 text-sm font-extrabold"
            >
              {t('cart.checkoutCta')}
            </Button>
          </Link>
        )}
      </SectionContainer>
    </div>
  )
}
