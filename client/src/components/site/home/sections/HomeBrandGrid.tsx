import { Link } from '@/lib/navigation'
import { Stagger, StaggerItem } from '@/components/motion'
import { BrandNameDisplay } from '../../brand/BrandNameDisplay'
import {
  brandCatalogHref,
  isDesignCategory,
  primaryCategoryLabel,
  type BrandCard,
} from '@/lib/brand.defaults'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  brands: BrandCard[]
  lp: LocalePathFn
  stagger?: number
}

export function HomeBrandGrid({ brands, lp, stagger = 0.04 }: Props) {
  return (
    <Stagger
      className={cn(
        '-mx-4 flex gap-3 overflow-x-auto scroll-smooth px-4 pb-1',
        'snap-x snap-mandatory',
        '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        'sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-0 sm:overflow-hidden sm:rounded-[10px]',
        'sm:border sm:border-idl-tech-border sm:bg-white sm:px-0 sm:pb-0 sm:snap-none',
        'lg:grid-cols-6 dark:sm:bg-idl-tech-panel',
      )}
      stagger={stagger}
    >
      {brands.map((brand) => {
        const design = isDesignCategory(brand.categories)
        const badge = primaryCategoryLabel(brand.categories)
        const productMeta =
          brand.productCount > 0 ? `${brand.productCount} prodotti` : 'Catalogo disponibile'
        const brandLabel = `${brand.name} — ${productMeta}`

        return (
          <StaggerItem
            key={brand.slug}
            className="w-[min(42vw,10.5rem)] shrink-0 snap-start sm:w-auto sm:shrink"
          >
            <article
              className={cn(
                'flex min-h-[148px] flex-col bg-white transition hover:bg-idl-cream',
                'rounded-lg border border-idl-tech-border',
                'sm:rounded-none sm:border-0 sm:border-b sm:border-r sm:border-idl-tech-border',
                'dark:bg-idl-tech-panel dark:hover:bg-idl-tech-panel',
              )}
            >
              <Link
                to={lp(brand.href)}
                className="flex flex-1 flex-col items-center px-3 py-5 text-center"
                aria-label={`Scopri ${brandLabel}`}
                title={brandLabel}
              >
                <div className="mb-3 flex h-11 w-full items-center justify-center">
                  <BrandNameDisplay name={brand.name} style={brand.displayStyle} size="sm" />
                </div>
                <span
                  className={cn(
                    'inline-flex rounded-[5px] border px-2 py-0.5 font-mono text-[10px] tracking-[0.06em]',
                    design
                      ? 'border-[#ece2d2] bg-idl-path-design text-idl-brass'
                      : 'border-idl-tech-chip-border bg-idl-tech-chip text-idl-graphite-2',
                  )}
                >
                  {badge}
                </span>
                <span className="mt-2 text-[11px] text-idl-muted">{productMeta}</span>
              </Link>
              <div className="border-t border-idl-tech-panel px-3 py-2.5 text-center">
                <Link
                  to={lp(brandCatalogHref(brand.slug))}
                  className="text-[12px] font-bold text-idl-brass transition hover:text-idl-graphite"
                  aria-label={`Catalogo prodotti ${brand.name}`}
                >
                  Catalogo →
                </Link>
              </div>
            </article>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}
