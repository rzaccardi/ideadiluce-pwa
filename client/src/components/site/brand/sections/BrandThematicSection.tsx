import { Link } from '@/lib/navigation'
import { Eyebrow, SectionContainer } from '../../primitives'
import { BRAND_THEMATIC, type BrandCard } from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  brands: BrandCard[]
  lp: LocalePathFn
}

function BrandWall({
  title,
  eyebrow,
  subtitle,
  slugs,
  allHref,
  brands,
  lp,
  variant,
}: {
  title: string
  eyebrow: string
  subtitle: string
  slugs: string[]
  allHref: string
  brands: BrandCard[]
  lp: LocalePathFn
  variant: 'design' | 'technical'
}) {
  const bySlug = new Map(brands.map((b) => [b.slug, b]))

  return (
    <div>
      <Eyebrow variant={variant === 'design' ? 'neutral' : 'technical'} className="mb-3">
        {eyebrow}
      </Eyebrow>
      <h3 className="text-[20px] font-extrabold tracking-tight text-idl-graphite">{title}</h3>
      <p className="mt-1.5 text-[13.5px] text-idl-graphite-2">{subtitle}</p>
      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
        {slugs.map((slug) => {
          const brand = bySlug.get(slug)
          if (!brand) return null
          return (
            <Link
              key={slug}
              to={lp(brand.href)}
              className="border-b border-r border-idl-tech-border bg-white px-2 py-5 text-center font-serif text-[14px] text-idl-graphite-2 transition hover:bg-idl-cream hover:text-idl-graphite dark:bg-idl-tech-panel dark:hover:bg-idl-tech-panel sm:text-base"
            >
              {brand.name}
            </Link>
          )
        })}
        <Link
          to={lp(allHref)}
          className="border-b border-r border-idl-tech-border bg-white px-2 py-5 text-center text-[13px] font-bold text-idl-brass transition hover:bg-idl-cream dark:bg-idl-tech-panel dark:hover:bg-idl-tech-panel"
        >
          Tutti →
        </Link>
      </div>
    </div>
  )
}

export function BrandThematicSection({ brands, lp }: Props) {
  return (
    <section className="border-t border-idl-tech-border bg-idl-tech-panel">
      <SectionContainer className="py-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-10">
          <BrandWall
            {...BRAND_THEMATIC.design}
            brands={brands}
            lp={lp}
            variant="design"
          />
          <BrandWall
            {...BRAND_THEMATIC.technical}
            brands={brands}
            lp={lp}
            variant="technical"
          />
        </div>
      </SectionContainer>
    </section>
  )
}
