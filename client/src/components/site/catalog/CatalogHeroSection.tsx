'use client'

import { Link } from '@/lib/navigation'
import { SectionContainer } from '../primitives'
import type { CatalogWorldTab } from '@/lib/catalog-filters'
import { cn } from '@/utils/cn'

type Props = {
  lp: (path: string) => string
  totalProducts: number
  worldTab: CatalogWorldTab
  designLabel: string
  technicalLabel: string
  onSelectTab: (tab: CatalogWorldTab) => void
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[30px] px-[18px] py-2.5 text-[13.5px] font-bold transition',
        active ? 'bg-white text-idl-ink shadow-sm' : 'bg-transparent text-idl-muted hover:text-idl-ink',
      )}
    >
      {children}
    </button>
  )
}

export function CatalogHeroSection({
  lp,
  totalProducts,
  worldTab,
  designLabel,
  technicalLabel,
  onSelectTab,
}: Props) {
  return (
    <section className="border-b border-idl-tech-border bg-white">
      <SectionContainer className="py-6 sm:py-7">
        <div className="mb-3.5 font-mono text-[11.5px] text-idl-muted">
          <Link to={lp('/')} className="hover:text-idl-ink">
            Home
          </Link>
          {' · '}
          <span className="text-idl-graphite-2">Catalogo completo</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[clamp(1.75rem,3vw,2rem)] font-extrabold tracking-tight text-idl-ink">
              Catalogo completo
            </h1>
            <p className="mt-1.5 text-[14.5px] text-idl-muted">
              Arredo e tecnica in un unico catalogo.{' '}
              <span className="font-bold text-idl-ink">{totalProducts.toLocaleString('it-IT')}</span> prodotti.
            </p>
          </div>

          <div className="flex gap-2 rounded-[30px] bg-idl-tech-panel p-1">
            <TabButton active={worldTab === 'all'} onClick={() => onSelectTab('all')}>
              Tutti
            </TabButton>
            <TabButton active={worldTab === 'design'} onClick={() => onSelectTab('design')}>
              {designLabel}
            </TabButton>
            <TabButton active={worldTab === 'technical'} onClick={() => onSelectTab('technical')}>
              {technicalLabel}
            </TabButton>
          </div>
        </div>
      </SectionContainer>
    </section>
  )
}
