'use client'

import { useMemo } from 'react'
import { formatMoney } from '@/lib/format'
import type { ProductAvailabilityDataDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'
import { getProductAvailabilityStatus } from '@/lib/product-availability'
import { cn } from '@/utils/cn'

type VariantItem = {
  ref: string
  label: string
  imageUrl?: string | null
  attributes: ReadonlyArray<{ name: string; value: string }>
  priceCents?: number
  inStock?: boolean
  availability?: ProductAvailabilityDataDTO
}

type Props = {
  variants: ReadonlyArray<VariantItem>
  selectedRef: string
  onChange: (ref: string) => void
  currency: string
  basePriceCents?: number
  className?: string
}

function isVariantOutOfStock(variant: VariantItem, locale: Parameters<typeof getProductAvailabilityStatus>[0]['locale']): boolean {
  const availability = variant.availability ?? (variant.inStock === false
    ? { qtyAvailable: 0, isOrderable: false, isUnrecoverable: false }
    : undefined)
  return getProductAvailabilityStatus({ availability, locale }).status === 'out_of_stock'
}

/** Nome attributo condiviso se ogni variante ha esattamente un valore per quel nome. */
function primaryAttributeName(variants: ReadonlyArray<VariantItem>): string | null {
  if (!variants.length || !variants[0].attributes.length) return null
  const candidate = variants[0].attributes[0]?.name
  if (!candidate) return null
  const allMatch = variants.every(
    (v) => v.attributes.length === 1 && v.attributes[0]?.name === candidate,
  )
  return allMatch ? candidate : null
}

function variantChoiceLabel(
  variant: VariantItem,
  primaryAttr: string | null,
  currency: string,
  basePriceCents?: number,
): string {
  if (primaryAttr) {
    const attr = variant.attributes.find((a) => a.name === primaryAttr)
    if (attr?.value) return attr.value
  }
  if (variant.attributes.length) {
    return variant.attributes.map((a) => a.value).join(' · ')
  }
  const base = variant.label.trim()
  const showPrice =
    variant.priceCents != null &&
    basePriceCents != null &&
    variant.priceCents !== basePriceCents
  if (showPrice) {
    return `${base} (${formatMoney(variant.priceCents!, currency)})`
  }
  return base
}

export function ProductVariantPicker({
  variants,
  selectedRef,
  onChange,
  currency,
  basePriceCents,
  className,
}: Props) {
  const { t, locale } = useI18n()
  const primaryAttr = useMemo(() => primaryAttributeName(variants), [variants])
  const useButtons = variants.length <= 12

  if (variants.length <= 1) return null

  const groupLabel = primaryAttr ?? t('product.variantLabel')
  const soldOutLabel = t('product.availability.outOfStock')

  function formatSelectLabel(variant: VariantItem): string {
    const base = variantChoiceLabel(variant, null, currency, basePriceCents)
    return isVariantOutOfStock(variant, locale) ? `${base} — ${soldOutLabel}` : base
  }

  if (useButtons) {
    return (
      <fieldset className={cn('block text-left text-sm', className)}>
        <legend className="mb-2 block w-full font-medium text-idl-ink-soft">{groupLabel}</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={groupLabel}>
          {variants.map((variant) => {
            const selected = selectedRef === variant.ref
            const outOfStock = isVariantOutOfStock(variant, locale)
            const label = variantChoiceLabel(variant, primaryAttr, currency, basePriceCents)
            return (
              <button
                key={variant.ref}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={outOfStock ? `${label}, ${soldOutLabel.toLowerCase()}` : label}
                onClick={() => onChange(variant.ref)}
                className={cn(
                  'inline-flex min-h-11 min-w-[3rem] flex-col items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2',
                  selected
                    ? 'border-zinc-900 bg-idl-ink text-white shadow-sm'
                    : 'border-idl-border-strong bg-idl-tech-panel text-idl-graphite hover:border-zinc-500',
                  outOfStock && !selected && 'border-idl-border text-idl-muted',
                )}
              >
                <span>{label}</span>
                {outOfStock ? (
                  <span
                    className={cn(
                      'mt-0.5 text-[10px] font-normal uppercase tracking-wide',
                      selected ? 'text-zinc-300' : 'text-idl-placeholder',
                    )}
                  >
                    {soldOutLabel}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </fieldset>
    )
  }

  return (
    <label className={cn('block text-left text-sm', className)}>
      <span className="mb-1 block font-medium text-idl-ink-soft">{groupLabel}</span>
      <select
        className="min-h-11 w-full cursor-pointer appearance-none rounded-lg border border-idl-border-strong bg-idl-tech-panel bg-[length:1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat px-3 py-2.5 pr-10 text-base text-idl-graphite outline-none focus:ring-2 focus:ring-zinc-400"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        }}
        value={selectedRef}
        onChange={(e) => onChange(e.target.value)}
      >
        {variants.map((variant) => (
          <option key={variant.ref} value={variant.ref}>
            {formatSelectLabel(variant)}
          </option>
        ))}
      </select>
    </label>
  )
}
