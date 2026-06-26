import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const PRODUCT_PLACEHOLDER = 'Informazione non disponibile'

export function ProductDetailPlaceholder({
  className,
  children = PRODUCT_PLACEHOLDER,
}: {
  className?: string
  children?: ReactNode
}) {
  return <span className={cn('italic text-idl-placeholder', className)}>{children}</span>
}

export function ProductDetailValue({
  value,
  className,
  mono,
  placeholder = PRODUCT_PLACEHOLDER,
}: {
  value?: string | null
  className?: string
  mono?: boolean
  placeholder?: string
}) {
  if (value?.trim()) {
    return (
      <span className={cn(mono && 'font-mono', className)}>{value}</span>
    )
  }
  return <ProductDetailPlaceholder className={className}>{placeholder}</ProductDetailPlaceholder>
}

type SpecRowProps = {
  label: string
  value?: string | null
  href?: string | null
  variant?: 'design' | 'technical'
  monoValue?: boolean
}

export function ProductSpecRowItem({
  label,
  value,
  href,
  variant = 'design',
  monoValue,
  compact,
}: SpecRowProps & { compact?: boolean }) {
  const isDesign = variant === 'design'

  return (
    <div
      className={cn(
        'flex justify-between gap-6',
        isDesign
          ? 'border-b border-idl-border py-3'
          : cn('border-b border-[#f0f2f5]', compact ? 'py-2.5' : 'px-4 py-2.5'),
      )}
    >
      <span className={cn('text-[14px]', isDesign ? 'text-[#8c8273]' : 'text-idl-muted')}>{label}</span>
      {href && value?.trim() ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-right text-sm font-semibold underline-offset-2 hover:underline',
            isDesign ? 'font-mono text-idl-brass' : 'text-idl-amber',
          )}
        >
          {value}
        </a>
      ) : (
        <ProductDetailValue
          value={value}
          mono={monoValue}
          className={cn(
            'max-w-[60%] text-right font-semibold',
            isDesign ? 'text-[14.5px] text-idl-ink' : 'text-sm text-idl-graphite',
            monoValue && 'font-mono text-[14px]',
          )}
        />
      )}
    </div>
  )
}

export function ProductDetailSectionLabel({
  children,
  variant = 'design',
  className,
}: {
  children: ReactNode
  variant?: 'design' | 'technical'
  className?: string
}) {
  return (
    <div
      className={cn(
        'font-mono text-[11px] tracking-[0.18em] uppercase',
        variant === 'design' ? 'text-idl-glow' : 'text-idl-amber',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ProductDetailCard({
  children,
  className,
  variant = 'technical',
}: {
  children: ReactNode
  className?: string
  variant?: 'design' | 'technical'
}) {
  return (
    <div
      className={cn(
        'rounded-[12px] border p-6 sm:p-[26px]',
        variant === 'design'
          ? 'border-idl-path-design-border bg-white'
          : 'border-idl-tech-border bg-white',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function buildProductSubtitle(product: {
  shortDescription?: string | null
  specTags?: readonly string[]
  brand?: { name: string } | null
}): string | null {
  if (product.shortDescription?.trim()) return product.shortDescription.trim()
  if (product.specTags?.length) return product.specTags.join(' · ')
  return null
}

export function buildProductMetaLine(product: {
  sku?: string | null
  specTags?: readonly string[]
}): string | null {
  const parts: string[] = []
  if (product.sku?.trim()) parts.push(`SKU ${product.sku.trim()}`)
  return parts.length ? parts.join(' · ') : null
}
