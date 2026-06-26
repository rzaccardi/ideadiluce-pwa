import type { HomePageContent } from '@/types/site-content'
import { SectionContainer } from '../../primitives'
import { Reveal } from '@/components/motion'
import { GuideCardGrid, SiteSectionHeader } from '../../sections'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  section: HomePageContent['guides']
  lp: LocalePathFn
}

export function HomeGuidesSection({ section, lp }: Props) {
  return (
    <Reveal className="border-t border-idl-border bg-idl-paper">
      <SectionContainer className="py-12 sm:py-14">
        <SiteSectionHeader
          eyebrow={section.eyebrow}
          title={section.title}
          subtitle={section.subtitle}
          subtitleClassName="text-[14.5px] text-idl-ink-muted"
          linkHref={section.linkHref}
          linkLabel={section.linkLabel}
          titleStyle="serif-md"
          layout="split"
          className="mb-6"
          lp={lp}
        />
        <GuideCardGrid items={section.items} lp={lp} variant="home" />
      </SectionContainer>
    </Reveal>
  )
}
