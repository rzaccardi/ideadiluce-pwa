'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'

export function CartCompatibilitySupport() {
  const lp = useLocalePath()
  const { t } = useI18n()

  return (
    <div className="rounded-[14px] border border-idl-promo-border bg-idl-promo-bg p-5">
      <h3 className="text-[15px] font-extrabold text-idl-graphite">{t('cart.compatibility.title')}</h3>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-idl-promo-text">
        {t('cart.compatibility.description')}
      </p>
      <Link
        to={lp('/prodotto-non-trovato')}
        className="mt-3.5 inline-block rounded-lg border border-[#e0d2bd] bg-idl-tech-panel px-4 py-2.5 text-[13px] font-bold text-idl-graphite transition hover:border-idl-border-strong"
      >
        {t('cart.compatibility.cta')}
      </Link>
    </div>
  )
}
