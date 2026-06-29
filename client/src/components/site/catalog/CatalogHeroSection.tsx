'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { SectionContainer } from '../primitives'
import { CatalogSearchTrigger } from './CatalogSearchTrigger'
import { CATALOG_WORLD_TAB_HREFS, type CatalogWorldTab } from '@/lib/catalog-filters'
import { cn } from '@/utils/cn'

type Props = {
  lp: (path: string) => string
  totalProducts: number
  worldTab: CatalogWorldTab
  designLabel: string
  technicalLabel: string
  searchQuery?: string
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={href}
      className={cn(
        'rounded-[30px] px-[18px] py-2.5 text-[13.5px] font-bold transition',
        active ? 'bg-idl-tech-panel text-idl-ink shadow-sm' : 'bg-transparent text-idl-muted hover:text-idl-ink',
      )}
    >
      {children}
    </Link>
  )
}

export function CatalogHeroSection({
  lp,
  totalProducts,
  worldTab,
  designLabel,
  technicalLabel,
  searchQuery = '',
}: Props) {
  const { t } = useI18n()

  return (
    <section className="border-b border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-6 sm:py-7">
        <div className="mb-3.5 font-mono text-[11.5px] text-idl-muted">
          <Link to={lp('/')} className="hover:text-idl-ink">
            Home
          </Link>
          {' · '}
          <span className="text-idl-graphite-2">Negozio</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(1.75rem,3vw,2rem)] font-extrabold tracking-tight text-idl-ink">
              Negozio
            </h1>
            <p className="mt-1.5 text-[14.5px] text-idl-muted">
              Arredo e tecnica in un unico negozio.{' '}
              <span className="font-bold text-idl-ink">{totalProducts.toLocaleString('it-IT')}</span> prodotti.
            </p>
          </div>

          <div className="flex gap-2 rounded-[30px] bg-idl-tech-panel p-1">
            <TabLink active={worldTab === 'all'} href={lp(CATALOG_WORLD_TAB_HREFS.all)}>
              Tutti
            </TabLink>
            <TabLink active={worldTab === 'design'} href={lp(CATALOG_WORLD_TAB_HREFS.design)}>
              {designLabel}
            </TabLink>
            <TabLink active={worldTab === 'technical'} href={lp(CATALOG_WORLD_TAB_HREFS.technical)}>
              {technicalLabel}
            </TabLink>
          </div>
        </div>

        <div className="mt-5 max-w-3xl">
          <label htmlFor="catalog-page-search" className="sr-only">
            {t('catalog.searchLabel')}
          </label>
          <CatalogSearchTrigger
            searchSource="catalog"
            id="catalog-page-search"
            variant="catalog"
            displayValue={searchQuery}
            placeholder={t('catalog.searchPlaceholder')}
            ctaLabel={t('catalog.search')}
            showHints={false}
          />
        </div>
      </SectionContainer>
    </section>
  )
}
