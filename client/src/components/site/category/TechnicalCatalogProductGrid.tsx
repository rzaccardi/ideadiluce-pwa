'use client'

import { Link } from '@/lib/navigation'
import { useLocale } from '@/context/locale-context'
import type { ProductCardDTO } from '@/types/dto'
import { formatMoney } from '@/lib/format'
import { buildTechnicalCardSpecTags } from '@/lib/technical-card-spec-tags'
import {
  formatAvailabilityPrimaryLabel,
  getProductAvailabilityStatus,
  resolveAvailabilityData,
} from '@/lib/product-availability'
import { SiteImage } from '../SiteImage'
import { HoverLift } from '@/components/motion'
import type { LocalePathFn } from '../sections/types'
import { TechnicalAddToCartButton } from './TechnicalAddToCartButton'

function stockLabel(product: ProductCardDTO, locale: Parameters<typeof getProductAvailabilityStatus>[0]['locale']) {
  const availability = getProductAvailabilityStatus({
    availability: resolveAvailabilityData(product),
    locale,
  })
  const label = formatAvailabilityPrimaryLabel(availability)
  if (availability.status === 'available') {
    return { label: `● ${label}`, className: 'text-emerald-600' }
  }
  if (availability.status === 'orderable') {
    return { label: `● ${label}`, className: 'text-amber-700' }
  }
  return { label: `● ${label}`, className: 'text-idl-muted' }
}

type Props = {
  product: ProductCardDTO
  lp: LocalePathFn
  addLabel?: string
}

export function TechnicalCatalogProductCard({ product, lp, addLabel = 'Aggiungi' }: Props) {
  const { locale } = useLocale()
  const stock = stockLabel(product, locale)
  const tags =
    product.specTags ??
    buildTechnicalCardSpecTags({
      name: product.name,
      shortDescription: product.shortDescription,
    })

  return (
    <HoverLift className="h-full">
      <div className="flex h-full flex-col rounded-lg border border-idl-tech-border bg-idl-tech-panel p-4 transition hover:border-idl-muted hover:shadow-md">
        <Link to={lp(`/prodotto/${product.slug}`)} className="block">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-[11px] font-bold ${stock.className}`}>{stock.label}</span>
            <span className="size-4 rounded border-[1.5px] border-idl-tech-chip-border" />
          </div>
          <div className="relative mb-3 aspect-square overflow-hidden rounded bg-idl-tech-panel">
            {product.imageUrl ? (
              <SiteImage src={product.imageUrl} alt="" fill className="object-cover" sizes="25vw" />
            ) : null}
          </div>
          <div className="font-mono text-[10.5px] text-idl-muted">{product.slug}</div>
          <div className="mt-1 line-clamp-2 min-h-[2lh] text-[13.5px] leading-snug font-semibold">{product.name}</div>
          {tags.length > 0 ? (
            <div className="mt-2.5 mb-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-idl-tech-panel px-1.5 py-0.5 font-mono text-[10.5px] text-idl-graphite-2"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <div className="mb-3" />
          )}
        </Link>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-extrabold">{formatMoney(product.priceCents, product.currency)}</span>
          <TechnicalAddToCartButton product={product} label={addLabel} />
        </div>
      </div>
    </HoverLift>
  )
}

type GridProps = {
  products: ReadonlyArray<ProductCardDTO>
  lp: LocalePathFn
}

export function TechnicalCatalogProductGrid({ products, lp }: GridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <div key={product.slug} className="h-full">
          <TechnicalCatalogProductCard product={product} lp={lp} />
        </div>
      ))}
    </div>
  )
}
