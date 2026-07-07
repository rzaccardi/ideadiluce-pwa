import type { CategoryLandingContent } from '@/types/category-landing'
import { Link } from '@/lib/navigation'
import { Eyebrow, SectionContainer } from '../../primitives'
import { SiteHeading, SiteSectionSrTitle } from '../../SiteHeading'
import { CategoryBreadcrumb } from '../CategoryBreadcrumb'
import { CategoryTypeIcon } from '../CategoryTypeIcons'
import type { LocalePathFn } from '../../sections/types'

type HeroProps = {
  content: Pick<CategoryLandingContent, 'breadcrumb' | 'eyebrow' | 'title' | 'description' | 'stats'>
  lp: LocalePathFn
}

export function DesignCategoryHeroSection({ content, lp }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-idl-design text-idl-design-fg">
      <div className="pointer-events-none absolute -top-16 -right-16 size-[280px] rounded-full bg-[radial-gradient(circle,rgba(201, 162, 75,0.22)_0%,rgba(201, 162, 75,0)_70%)] sm:-top-20 sm:right-4 sm:size-[380px] lg:right-20 lg:size-[520px]" />
      <SectionContainer className="relative z-[2] py-5 pb-10 pt-4 sm:py-8 sm:pb-16 sm:pt-5">
        <CategoryBreadcrumb items={content.breadcrumb} lp={lp} variant="design" />
        <div className="max-w-2xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h1 className="mt-3 font-serif text-[31px] leading-[1.05] font-medium tracking-tight sm:mt-4 sm:text-[36px] lg:text-[46px]">
            {content.title}
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-idl-design-muted sm:mt-4 sm:text-[17px]">
            {content.description}
          </p>
          {content.stats?.length ? (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-idl-design-dim sm:mt-7 sm:gap-7">
              {content.stats.map((stat) => (
                <span key={stat.label}>
                  <span className="font-mono text-[15px] text-idl-design-fg">{stat.value}</span> {stat.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </SectionContainer>
    </section>
  )
}

export function DesignCategoryTypeGridSection({
  tiles,
  lp,
}: {
  tiles: NonNullable<CategoryLandingContent['typeTiles']>
  lp: LocalePathFn
}) {
  return (
    <section className="border-b border-idl-border bg-idl-path-design">
      <SectionContainer className="py-6 sm:py-8">
        <SiteSectionSrTitle>Tipologie di prodotto</SiteSectionSrTitle>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 sm:snap-none lg:grid-cols-6">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              to={lp(tile.href)}
              className="flex w-[calc(50%-5px)] shrink-0 snap-start flex-col items-center gap-1.5 rounded-lg border border-idl-path-design-border bg-idl-tech-panel px-1.5 py-3 transition hover:border-idl-brass sm:w-auto sm:shrink sm:gap-2 sm:px-2 sm:py-4"
            >
              <CategoryTypeIcon tile={tile} />
              <div className="text-center">
                <SiteHeading level={3} className="font-serif text-[14px] text-idl-ink sm:text-base">
                  {tile.label}
                </SiteHeading>
                {tile.count ? <div className="mt-0.5 text-[11.5px] text-idl-ink-muted">{tile.count}</div> : null}
              </div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
