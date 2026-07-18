import type { ReactNode } from 'react'
import { ExternalLink } from '@/lib/link-title'
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
}: {
  value?: string | null
  className?: string
  mono?: boolean
}) {
  if (!value?.trim()) return null
  return <span className={cn(mono && 'font-mono', className)}>{value}</span>
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
  if (!value?.trim() && !href) return null
  const isDesign = variant === 'design'

  return (
    <div
      className={cn(
        'flex justify-between gap-4',
        isDesign
          ? 'border-b border-idl-border py-3'
          : cn('border-b border-[#f0f2f5]', compact ? 'py-2.5' : 'px-4 py-2.5'),
      )}
    >
      <span className={cn('shrink-0 text-[14px]', isDesign ? 'text-idl-ink-muted' : 'text-idl-muted')}>{label}</span>
      {href && value?.trim() ? (
        <ExternalLink
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-right text-sm font-semibold underline-offset-2 hover:underline',
            isDesign ? 'font-mono text-idl-brass' : 'text-idl-amber',
          )}
        >
          {value}
        </ExternalLink>
      ) : (
        <ProductDetailValue
          value={value}
          mono={monoValue}
          className={cn(
            'min-w-0 break-words text-right font-semibold',
            isDesign ? 'max-w-[65%] text-[14.5px] text-idl-ink' : 'max-w-[60%] text-sm text-idl-graphite',
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
          ? 'border-idl-path-design-border bg-idl-tech-panel'
          : 'border-idl-tech-border bg-idl-tech-panel',
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
