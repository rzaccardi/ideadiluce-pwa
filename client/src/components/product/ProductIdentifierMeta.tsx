'use client'

import { useMemo } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import type { ProductDetailDTO, ProductVariantDTO } from '@/types/dto'
import {
  collectProductIdentifierFields,
  formatProductIdentifierInline,
  type ProductIdentifierFieldKey,
  type ProductIdentifierSource,
} from '@/lib/product-identifier-fields'
import { cn } from '@/utils/cn'

type ProductLike = ProductIdentifierSource &
  Partial<Pick<ProductDetailDTO, 'weightKg' | 'lengthMeters' | 'dimensions'>>

type Props = {
  product: ProductLike
  variant?: Pick<ProductVariantDTO, 'ean' | 'ced' | 'manufacturerCode'> | null
  includeBrand?: boolean
  layout?: 'inline' | 'rows'
  className?: string
  labelClassName?: string
  valueClassName?: string
}

function useProductIdentifierLabels(): Record<ProductIdentifierFieldKey, string> {
  const { t } = useI18n()
  return useMemo(
    () => ({
      brand: t('product.meta.brand'),
      manufacturerCode: t('product.meta.manufacturerCode'),
      ced: t('product.meta.ced'),
      sku: t('product.meta.sku').replace(/:$/, ''),
      defaultCode: t('product.meta.defaultCode'),
      ean: t('product.meta.ean').replace(/:$/, ''),
      weightKg: t('product.meta.weightKg'),
      lengthMeters: t('product.meta.lengthMeters'),
      dimensions: t('product.meta.dimensions'),
    }),
    [t],
  )
}

export function ProductIdentifierMeta({
  product,
  variant = null,
  includeBrand = true,
  layout = 'inline',
  className,
  labelClassName,
  valueClassName,
}: Props) {
  const labels = useProductIdentifierLabels()
  const fields = useMemo(
    () => collectProductIdentifierFields(product, variant, { includeBrand }),
    [product, variant, includeBrand],
  )

  if (!fields.length) return null

  if (layout === 'inline') {
    const line = formatProductIdentifierInline(fields, labels)
    if (!line) return null
    return <div className={cn('font-mono', className)}>{line}</div>
  }

  return (
    <dl className={cn('space-y-2', className)}>
      {fields.map((field) => (
        <div key={field.key} className="flex flex-wrap gap-x-2 text-sm">
          <dt className={cn('font-medium text-idl-ink-soft', labelClassName)}>{labels[field.key]}</dt>
          <dd className={cn('font-mono', valueClassName)}>{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function useProductIdentifierInline(
  product: ProductLike,
  variant?: Pick<ProductVariantDTO, 'ean' | 'ced' | 'manufacturerCode'> | null,
  options?: { includeBrand?: boolean },
): string | null {
  const labels = useProductIdentifierLabels()
  const fields = useMemo(
    () => collectProductIdentifierFields(product, variant, options),
    [product, variant, options?.includeBrand],
  )
  return useMemo(() => formatProductIdentifierInline(fields, labels), [fields, labels])
}
