import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { BrandNameDisplay } from '../BrandNameDisplay'
import type { BrandCard } from '@/lib/brand.defaults'
import { isDesignCategory } from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  brands: BrandCard[]
  lp: LocalePathFn
}

export function BrandFeaturedSection({ brands, lp }: Props) {
  if (brands.length === 0) return null

  return (
    <section className="bg-[#fbfbfa]">
      <SectionContainer className="pb-2 pt-10 sm:pt-12">
        <h2 className="text-[22px] font-extrabold tracking-tight text-idl-graphite">Brand in evidenza</h2>
        <p className="mt-1 text-[14px] text-idl-graphite-2">Una selezione dei marchi più richiesti del catalogo.</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {brands.map((brand) => {
            const design = isDesignCategory(brand.categories)
            return (
              <Link
                key={brand.slug}
                to={lp(brand.href)}
                className="flex flex-col rounded-[14px] border border-idl-tech-border bg-white p-6 transition hover:border-[#cfd4db] hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] sm:p-7"
              >
                <div className="mb-5 flex h-16 items-center">
                  <BrandNameDisplay name={brand.name} style={brand.displayStyle} size="lg" />
                </div>
                <p className="text-[14px] leading-relaxed text-idl-graphite-2">{brand.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {brand.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'rounded-[20px] border px-2.5 py-1 text-[11.5px]',
                        design
                          ? 'border-[#ece2d2] bg-idl-path-design text-idl-ink-soft'
                          : 'border-idl-tech-chip-border bg-idl-tech-chip text-idl-graphite-2',
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="text-[12.5px] text-idl-muted">
                    {brand.productCount > 0 ? `${brand.productCount} prodotti` : 'Catalogo'}
                  </span>
                  <span className="text-[13.5px] font-bold text-idl-brass">Scopri il brand →</span>
                </div>
              </Link>
            )
          })}
        </div>
      </SectionContainer>
    </section>
  )
}
