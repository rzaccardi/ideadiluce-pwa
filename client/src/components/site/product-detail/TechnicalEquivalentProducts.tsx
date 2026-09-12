'use client'

import { useState } from 'react'
import { Link } from '@/lib/navigation'
import type { ProductCardDTO, ProductRelatedDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { formatPriceDisplayModeLabel } from '@/lib/price-display'
import { extractProductDisplayTitle } from '@/lib/product-display-title'
import { SiteImage } from '@/components/site/SiteImage'
import { ProductBrandMark } from '@/components/product/ProductBrandMark'
import { CopyableEanValue } from '@/components/product/CopyableEanValue'
import { SectionContainer } from '@/components/site/primitives'
import { inferTechnicalProductBrandFromName } from '@/lib/technical-product-ref'
import { addItem, buildCartAddHintFromCard } from '@/features/cart'
import type { LocalePathFn } from '@/components/site/sections/types'
import { ProductDetailSectionLabel } from './shared'
import { selectTechnicalEquivalents } from './technical-equivalents'
import { useI18n } from '@/hooks/use-i18n'

const MAX_EQUIVALENTS = 8

type Props = {
  products: ReadonlyArray<ProductRelatedDTO | ProductCardDTO>
  currentSlug: string
  lp: LocalePathFn
}

/**
 * Sinonimi / equivalenti di marca sulla PDP tecnica.
 * Visibile solo se Odoo ha popolato `related_products` con relation alternative / synonym.
 */
export function TechnicalEquivalentProducts({ products, currentSlug, lp }: Props) {
  const { t } = useI18n()
  const items = selectTechnicalEquivalents(products, currentSlug).slice(0, MAX_EQUIVALENTS)
  const [addingSlug, setAddingSlug] = useState<string | null>(null)
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
          const ean = item.ean?.trim() || null
          const isAdding = addingSlug === item.slug

          return (
            <li key={item.slug} className="border-b border-idl-tech-chip last:border-b-0">
              <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                <Link
                  to={lp(`/prodotto/${item.slug}`)}
                  className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-idl-tech-chip bg-idl-tech-panel transition hover:border-idl-amber sm:size-16"
                >
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
                </Link>

                <div className="min-w-0 flex-1">
                  <ProductBrandMark
                    brand={brand}
                    fallbackLabel={brand?.name ?? 'Altra marca'}
                    size="xs"
                    className="text-idl-muted"
                  />
                  <Link
                    to={lp(`/prodotto/${item.slug}`)}
                    className="mt-0.5 block truncate text-[14px] font-semibold text-idl-graphite hover:text-idl-amber sm:text-[15px]"
                  >
                    {title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-idl-amber uppercase">
                      Equivalente
                    </span>
                    {specLine ? (
                      <span className="font-mono text-[11px] text-idl-muted">{specLine}</span>
                    ) : null}
                    {ean ? (
                      <span className="font-mono text-[11px] text-idl-muted">
                        EAN <CopyableEanValue value={ean} className="font-mono text-[11px]" />
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {item.priceCents > 0 ? (
                    <div className="text-right">
                      <div className="text-[15px] font-extrabold tracking-tight text-idl-graphite">
                        {formatMoney(item.priceCents, item.currency)}
                      </div>
                      {priceMode ? (
                        <div className="text-[11px] text-idl-muted">{priceMode}</div>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={isAdding}
                      onClick={() => {
                        setAddingSlug(item.slug)
                        void addItem(item.slug, 1, undefined, {
                          feedback: { productName: item.name, imageUrl: item.imageUrl },
                          productHint: buildCartAddHintFromCard(item),
                        }).finally(() => setAddingSlug(null))
                      }}
                      className="rounded-lg bg-idl-amber px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-idl-cta-amber-hover disabled:opacity-60"
                    >
                      {isAdding ? t('product.addingToCart') : t('product.addToCartShort')}
                    </button>
                    <Link
                      to={lp(`/prodotto/${item.slug}`)}
                      className="rounded-lg border border-idl-tech-border px-2.5 py-1.5 text-xs font-bold text-idl-amber transition hover:border-idl-amber"
                    >
                      Vedi
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </SectionContainer>
  )
}
