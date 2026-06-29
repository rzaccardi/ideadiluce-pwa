import type { HomePageContent } from '@/types/site-content'
import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { Reveal } from '@/components/motion'
import { SiteSectionHeader } from '../../sections'
import type { BrandCard } from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'
import { HomeBrandGrid } from './HomeBrandGrid'

type Props = {
  section: HomePageContent['brands']
  brands: BrandCard[]
  lp: LocalePathFn
}

export function HomeBrandsSection({ section, brands, lp }: Props) {
  if (brands.length === 0) return null

  return (
    <Reveal className="border-t border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-12 sm:py-14">
        <SiteSectionHeader
          title={section.title}
          subtitle={section.subtitle}
          linkHref={section.linkHref}
          linkLabel={section.linkLabel}
          layout="split"
          className="mb-6"
          lp={lp}
        />
        <HomeBrandGrid brands={brands} lp={lp} />
        <div className="mt-8 text-center">
          <Link
            to={lp(section.ctaHref)}
            className="inline-flex rounded-lg border border-idl-tech-border px-8 py-3 text-[14px] font-semibold text-idl-graphite transition hover:border-idl-brass hover:text-idl-brass"
          >
            {section.ctaLabel}
          </Link>
        </div>
      </SectionContainer>
    </Reveal>
  )
}
