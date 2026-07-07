'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { EditorialPageContent, SitePageKey } from '@/types/site-content'
import { Breadcrumb } from '@/components/Breadcrumb'
import { PageHeader } from '@/components/PageHeader'
import { SiteSectionSrTitle } from '@/components/site/SiteHeading'
import { Reveal } from '@/components/motion'
import {
  BrandGrid,
  GuideCardGrid,
  RoomCardGrid,
  SocketTileGrid,
  type SocketTileItem,
} from '@/components/site/sections'

type EditorialLayout = 'tiles' | 'rooms' | 'brands' | 'guides'

const LAYOUT_BY_PAGE: Partial<Record<SitePageKey, EditorialLayout>> = {
  attacco: 'tiles',
  ambienti: 'rooms',
  brand: 'brands',
  guide: 'guides',
}

function EditorialEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10.5px] tracking-[0.18em] text-idl-brass-light uppercase">
      {children}
    </div>
  )
}

function toSocketItems(items: EditorialPageContent['items']): SocketTileItem[] {
  return items.map((item) => ({
    code: item.code ?? item.title,
    title: item.title,
    description: item.description,
    href: item.href,
  }))
}

type Props = {
  pageKey: SitePageKey
  content: EditorialPageContent
}

export function EditorialPageView({ pageKey, content }: Props) {
  const lp = useLocalePath()
  const layout = LAYOUT_BY_PAGE[pageKey] ?? 'tiles'

  return (
    <main>
      <Reveal immediate>
        <Breadcrumb items={[{ label: content.title }]} />
        {content.eyebrow ? <EditorialEyebrow>{content.eyebrow}</EditorialEyebrow> : null}
        <PageHeader title={content.title} description={content.subtitle} />
      </Reveal>
      {content.intro ? (
        <Reveal className="mb-8 max-w-3xl text-[15px] leading-relaxed text-idl-ink-muted">
          <p>{content.intro}</p>
        </Reveal>
      ) : null}

      {layout === 'guides' ? (
        <>
          <SiteSectionSrTitle>Guide in evidenza</SiteSectionSrTitle>
          <GuideCardGrid items={content.items} lp={lp} variant="editorial" />
        </>
      ) : (
        <Reveal immediate delay={0.05}>
          <SiteSectionSrTitle>
            {layout === 'tiles'
              ? 'Attacchi disponibili'
              : layout === 'rooms'
                ? 'Ambienti'
                : 'Brand in evidenza'}
          </SiteSectionSrTitle>
          {layout === 'tiles' ? <SocketTileGrid items={toSocketItems(content.items)} lp={lp} variant="editorial" /> : null}
          {layout === 'rooms' ? <RoomCardGrid items={content.items} lp={lp} variant="editorial" /> : null}
          {layout === 'brands' ? <BrandGrid items={content.items} lp={lp} variant="editorial" stagger={0.03} /> : null}
        </Reveal>
      )}

      {content.cta ? (
        <Reveal className="mt-10">
          <Link to={lp(content.cta.href)} className="text-sm font-bold text-idl-brass">
            {content.cta.label}
          </Link>
        </Reveal>
      ) : null}
      {content.footerNote ? (
        <p className="mt-6 text-xs text-idl-muted">{content.footerNote}</p>
      ) : null}
    </main>
  )
}
