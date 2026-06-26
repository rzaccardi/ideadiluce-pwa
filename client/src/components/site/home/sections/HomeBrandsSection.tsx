import type { HomePageContent } from '@/types/site-content'
import { SectionContainer } from '../../primitives'
import { Reveal } from '@/components/motion'
import { BrandGrid } from '../../sections'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  section: HomePageContent['brands']
  lp: LocalePathFn
}

export function HomeBrandsSection({ section, lp }: Props) {
  return (
    <Reveal className="border-t border-idl-tech-border bg-white">
      <SectionContainer className="py-12">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight">{section.title}</h2>
          <p className="mt-1 text-sm text-idl-muted">{section.subtitle}</p>
        </div>
        <div className="mt-6">
          <BrandGrid items={section.items} lp={lp} variant="home" />
        </div>
      </SectionContainer>
    </Reveal>
  )
}
