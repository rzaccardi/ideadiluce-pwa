'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { SectionContainer } from '../primitives'
import { CatalogSearchTrigger } from './CatalogSearchTrigger'
import { CATALOG_WORLD_TAB_HREFS, type CatalogWorldTab } from '@/lib/catalog-filters'
import { ui } from '@/lib/ui-classes'
import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

type Props = {
  lp: (path: string) => string
  totalProducts: number
  worldTab: CatalogWorldTab
  designLabel: string
  technicalLabel: string
  searchQuery?: string
  afterSearch?: ReactNode
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
        ui.interactive,
        'shrink-0 whitespace-nowrap rounded-[30px] px-[18px] py-2.5 text-[13.5px] font-bold',
        active
          ? 'bg-idl-white text-idl-ink shadow-sm'
          : 'text-idl-graphite-2 hover:bg-idl-tech-panel/60 hover:text-idl-ink',
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
  afterSearch,
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

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-[clamp(1.75rem,3vw,2rem)] font-extrabold tracking-tight text-idl-ink">
              Negozio
            </h1>
            <p className="mt-1.5 text-[14.5px] text-idl-muted">
              Arredo e tecnica in un unico negozio.{' '}
              <span className="font-bold text-idl-ink">{totalProducts.toLocaleString('it-IT')}</span> prodotti.
            </p>
          </div>

          <div className="-mx-4 flex w-full gap-1 overflow-x-auto rounded-[30px] border border-idl-tech-chip-border bg-idl-tech-chip p-1 px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:w-auto sm:gap-1.5 sm:overflow-visible sm:px-1.5 sm:pb-1 [&::-webkit-scrollbar]:hidden">
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

        {afterSearch}
      </SectionContainer>
    </section>
  )
}
