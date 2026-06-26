'use client'

import { Link } from '@/lib/navigation'
import { SectionContainer } from '@/components/site/primitives'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  itemCount: number
}

export function CartHeroSection({ itemCount }: Props) {
  const lp = useLocalePath()
  const { t, tParams } = useI18n()

  const countLabel =
    itemCount === 1
      ? tParams('cart.itemCountOne', { count: itemCount })
      : tParams('cart.itemCountMany', { count: itemCount })

  return (
    <section className="border-b border-idl-tech-border bg-white">
      <SectionContainer className="py-6 sm:py-7">
        <div className="mb-3 font-mono text-[11.5px] text-idl-muted">
          <Link to={lp('/')} className="transition hover:text-idl-ink">
            Home
          </Link>
          {' · '}
          <span className="text-idl-graphite-2">{t('cart.title')}</span>
        </div>

        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[clamp(1.65rem,3vw,1.875rem)] font-extrabold tracking-tight text-idl-ink">
            {t('cart.pageTitle')}
          </h1>
          {itemCount > 0 ? (
            <p className="text-[15px] text-idl-muted">{countLabel}</p>
          ) : null}
        </div>
      </SectionContainer>
    </section>
  )
}
