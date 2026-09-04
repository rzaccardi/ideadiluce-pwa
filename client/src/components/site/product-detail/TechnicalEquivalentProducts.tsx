import { Link } from '@/lib/navigation'
import type { ProductCardDTO, ProductRelatedDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { formatPriceDisplayModeLabel } from '@/lib/price-display'
import { extractProductDisplayTitle } from '@/lib/product-display-title'
import { SiteImage } from '@/components/site/SiteImage'
import { ProductBrandMark } from '@/components/product/ProductBrandMark'
import { SectionContainer } from '@/components/site/primitives'
import { inferTechnicalProductBrandFromName } from '@/lib/technical-product-ref'
import type { LocalePathFn } from '@/components/site/sections/types'
import { ProductDetailSectionLabel } from './shared'
import { selectTechnicalEquivalents } from './technical-equivalents'

const MAX_EQUIVALENTS = 8

type Props = {
  products: ReadonlyArray<ProductRelatedDTO | ProductCardDTO>
  currentSlug: string
  lp: LocalePathFn
}

/**
 * Sinonimi / equivalenti di marca sulla PDP tecnica.
 * Visibile solo se Odoo ha popolato `related_products` con relation alternative.
 */
export function TechnicalEquivalentProducts({ products, currentSlug, lp }: Props) {
  const items = selectTechnicalEquivalents(products, currentSlug).slice(0, MAX_EQUIVALENTS)
  if (items.length === 0) return null

  return (
    <SectionContainer className="border-t border-idl-tech-chip py-10 sm:py-12">
      <ProductDetailSectionLabel variant="technical" className="mb-2.5">
        Equivalenti compatibili
      </ProductDetailSectionLabel>
      <h2 className="text-xl font-extrabold tracking-tight sm:text-[22px]">
        Stesso prodotto, altre marche
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-idl-muted">
        Stesse caratteristiche e attacco, brand diverso. È la versione identica e compatibile — non
        un accessorio e non un suggerimento generico.
      </p>

      <ul className="mt-5 overflow-hidden rounded-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
        {items.map((item) => {
          const brand = item.brand ?? inferTechnicalProductBrandFromName(item.name)
          const { title } = extractProductDisplayTitle(item.name)
          const specLine = item.specTags?.filter(Boolean).slice(0, 4).join(' · ')
          const priceMode = formatPriceDisplayModeLabel(item.priceDisplayMode)

          return (
            <li key={item.slug} className="border-b border-idl-tech-chip last:border-b-0">
              <Link
                to={lp(`/prodotto/${item.slug}`)}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-amber-50/50 sm:gap-4 sm:px-5"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-idl-tech-chip bg-idl-tech-panel sm:size-16">
                  {item.imageUrl ? (
                    <SiteImage
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[11px] text-idl-muted">
                      —
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <ProductBrandMark
                    brand={brand}
                    fallbackLabel={brand?.name ?? 'Altra marca'}
                    size="xs"
                    className="text-idl-muted"
                  />
                  <div className="mt-0.5 truncate text-[14px] font-semibold text-idl-graphite sm:text-[15px]">
                    {title}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-idl-amber uppercase">
                      Equivalente
                    </span>
                    {specLine ? (
                      <span className="font-mono text-[11px] text-idl-muted">{specLine}</span>
                    ) : null}
                  </div>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  {item.priceCents > 0 ? (
                    <>
                      <div className="text-[15px] font-extrabold tracking-tight text-idl-graphite">
                        {formatMoney(item.priceCents, item.currency)}
                      </div>
                      {priceMode ? (
                        <div className="text-[11px] text-idl-muted">{priceMode}</div>
                      ) : null}
                    </>
                  ) : null}
                  <div className="mt-1 text-[13px] font-bold text-idl-amber">Vedi scheda →</div>
                </div>
                <span className="shrink-0 text-[13px] font-bold text-idl-amber sm:hidden">Vedi →</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </SectionContainer>
  )
}
