'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Theme = 'light' | 'dark'

export function CheckoutLegalLinks({
  theme = 'light',
  showPoweredBy = true,
  className,
}: {
  theme?: Theme
  showPoweredBy?: boolean
  className?: string
}) {
  const lp = useLocalePath()
  const { t } = useI18n()
  const dark = theme === 'dark'

  return (
    <nav aria-label={t('footer.legal.heading')}>
      <ul
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs',
          dark ? 'text-[#8a8a90]' : 'text-[#9298a3]',
          className,
        )}
      >
        {showPoweredBy ? (
          <>
            <li>{t('checkout.poweredByStripe')}</li>
            <li aria-hidden className={dark ? 'text-[#8a8a90]/60' : 'text-[#9298a3]/60'}>
              ·
            </li>
          </>
        ) : null}
        <li>
          <Link
            to={lp('/tos')}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(dark ? 'hover:text-[#f5f5f5]' : 'hover:text-idl-graphite')}
          >
            {t('legal.terms')}
          </Link>
        </li>
        <li aria-hidden className={dark ? 'text-[#8a8a90]/60' : 'text-[#9298a3]/60'}>
          ·
        </li>
        <li>
          <Link
            to={lp('/privacy-policy')}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(dark ? 'hover:text-[#f5f5f5]' : 'hover:text-idl-graphite')}
          >
            {t('legal.privacy')}
          </Link>
        </li>
      </ul>
    </nav>
  )
}
