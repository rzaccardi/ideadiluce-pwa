'use client'

import { useMemo } from 'react'
import type { ProductDetailDTO, ProductGalleryItemDTO } from '@/types/dto'
import { SiteImage } from '@/components/site/SiteImage'
import {
  buildAllProductDimensionRows,
  isMeasureGalleryTag,
  type ProductSpecRow,
} from '@/lib/product-specs-parse'
import { ProductDetailCard, ProductSpecRowItem } from './shared'

type Props = {
  product: ProductDetailDTO
  specRows: ReadonlyArray<ProductSpecRow>
  /** Attributi della variante selezionata (es. Dimensioni: 22 cm). */
  variantAttributes?: ReadonlyArray<{ name: string; value: string }> | null
  variant?: 'design' | 'technical'
}

export function measureGalleryImages(
  gallery: ProductDetailDTO['gallery'],
): ProductGalleryItemDTO[] {
  return (gallery ?? []).filter(
    (item) => item.type === 'image' && isMeasureGalleryTag(item.tag) && Boolean(item.url),
  )
}

export function hasProductDimensionsContent(
  product: ProductDetailDTO,
  specRows: ReadonlyArray<ProductSpecRow>,
  variantAttributes?: ReadonlyArray<{ name: string; value: string }> | null,
): boolean {
  return (
    buildAllProductDimensionRows({
      dimensions: product.dimensions,
      weightKg: product.weightKg,
      lengthMeters: product.lengthMeters,
      specRows,
      variantAttributes,
    }).length > 0 || measureGalleryImages(product.gallery).length > 0
  )
}

export function ProductDimensionsPanel({
  product,
  specRows,
  variantAttributes,
  variant = 'design',
}: Props) {
  const isDesign = variant === 'design'

  const dimensionRows = useMemo(
    () =>
      buildAllProductDimensionRows({
        dimensions: product.dimensions,
        weightKg: product.weightKg,
        lengthMeters: product.lengthMeters,
        specRows,
        variantAttributes,
      }),
    [
      product.dimensions,
      product.weightKg,
      product.lengthMeters,
      specRows,
      variantAttributes,
    ],
  )

  const measureImages = useMemo(() => measureGalleryImages(product.gallery), [product.gallery])

  if (!dimensionRows.length && !measureImages.length) return null

  return (
    <ProductDetailCard variant={variant}>
      <h3
        className={
          isDesign
            ? 'mb-[18px] font-serif text-xl font-medium text-idl-ink'
            : 'mb-4 text-base font-extrabold tracking-tight'
        }
      >
        Dimensioni e ingombri
      </h3>

      <div
        className={
          measureImages.length && dimensionRows.length
            ? 'grid gap-5 sm:gap-6'
            : undefined
        }
      >
        {dimensionRows.length > 0 ? (
          <div>
            {dimensionRows.map((row) => (
              <ProductSpecRowItem
                key={`${row.key ?? row.label}:${row.value}`}
                label={row.label}
                value={row.value}
                href={row.href}
                variant={variant}
                monoValue
                compact={!isDesign}
              />
            ))}
          </div>
        ) : null}

        {measureImages.length > 0 ? (
          <div className="space-y-3">
            {measureImages.map((item) => (
              <div
                key={item.url}
                className={
                  isDesign
                    ? 'relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-idl-border bg-idl-paper'
                    : 'relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-idl-tech-border bg-[#f7f8fa]'
                }
              >
                <SiteImage
                  src={item.url}
                  alt={item.alt?.trim() || 'Schema dimensioni e ingombri'}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </ProductDetailCard>
  )
}
