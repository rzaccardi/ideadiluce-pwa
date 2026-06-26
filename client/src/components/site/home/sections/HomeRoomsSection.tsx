import type { HomePageContent } from '@/types/site-content'
import { SectionContainer } from '../../primitives'
import { Reveal } from '@/components/motion'
import { RoomCardGrid, SiteSectionHeader } from '../../sections'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  section: HomePageContent['rooms']
  lp: LocalePathFn
}

export function HomeRoomsSection({ section, lp }: Props) {
  return (
    <Reveal className="border-y border-idl-border bg-idl-path-design">
      <SectionContainer className="py-12 sm:py-14">
        <SiteSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          subtitleClassName="text-[14.5px] text-idl-ink-muted"
          titleStyle="serif-md"
          className="mb-6"
          lp={lp}
        />
        <RoomCardGrid items={section.items} lp={lp} variant="home" />
      </SectionContainer>
    </Reveal>
  )
}
