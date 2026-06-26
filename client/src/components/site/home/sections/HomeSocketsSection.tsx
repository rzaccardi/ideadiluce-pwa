import type { HomePageContent } from '@/types/site-content'
import { SectionContainer } from '../../primitives'
import { Reveal } from '@/components/motion'
import { SiteSectionHeader, SocketTileGrid } from '../../sections'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  section: HomePageContent['sockets']
  lp: LocalePathFn
}

export function HomeSocketsSection({ section, lp }: Props) {
  return (
    <Reveal className="border-b border-idl-tech-border bg-white">
      <SectionContainer className="py-10 sm:py-12">
        <SiteSectionHeader
          eyebrow={section.eyebrow}
          eyebrowVariant="technical"
          title={section.title}
          subtitle={section.subtitle}
          linkHref={section.linkHref}
          linkLabel={section.linkLabel}
          linkTone="amber"
          layout="split"
          className="mb-5"
          lp={lp}
        />
        <SocketTileGrid items={section.items} lp={lp} variant="home" />
      </SectionContainer>
    </Reveal>
  )
}
