import type { HomePageContent } from '@/types/site-content'
import { SectionContainer } from '../../primitives'
import { Reveal } from '@/components/motion'
import { PathCardGrid } from '../../sections'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  section: HomePageContent['paths']
  lp: LocalePathFn
}

export function HomePathsSection({ section, lp }: Props) {
  return (
    <Reveal>
      <section aria-labelledby="home-paths-title">
        <SectionContainer className="py-12 sm:py-14">
          <h2 id="home-paths-title" className="text-[26px] font-extrabold tracking-tight">
            {section.title}
          </h2>
        <p className="mt-1.5 text-[14.5px] text-idl-muted">{section.subtitle}</p>
        <PathCardGrid cards={section.cards} lp={lp} />
        </SectionContainer>
      </section>
    </Reveal>
  )
}
