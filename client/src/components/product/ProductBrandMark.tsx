import type { ProductBrandDTO } from '@/types/dto'
import { resolveBrandLogoSrc } from '@/lib/brand-logo'
import { cn } from '@/utils/cn'

type Size = 'xs' | 'sm' | 'md' | 'lg'

type Props = {
  brand?: ProductBrandDTO | null
  /** Testo fallback se manca brand DTO ma c’è una label (es. categoria). */
  fallbackLabel?: string | null
  size?: Size
  className?: string
  /** Se false e non c’è logo, non mostra il nome testuale. */
  showNameFallback?: boolean
}

const HEIGHT: Record<Size, number> = {
  xs: 16,
  sm: 22,
  md: 28,
  lg: 40,
}

const NAME_CLASS: Record<Size, string> = {
  xs: 'text-[10px] tracking-[0.08em]',
  sm: 'text-[10.5px] tracking-[0.08em]',
  md: 'text-[11px] tracking-[0.1em]',
  lg: 'text-xs tracking-[0.12em]',
}

const DARK_NAME_CLASS: Record<Size, string> = {
  xs: 'text-[11px]',
  sm: 'text-xs',
  md: 'text-[13px]',
  lg: 'text-sm',
}

/**
 * Logo brand da `/brands/{slug}.jpg`, con fallback al nome.
 */
export function ProductBrandMark({
  brand,
  fallbackLabel,
  size = 'sm',
  className,
  showNameFallback = true,
}: Props) {
  const logoSrc =
    resolveBrandLogoSrc(brand?.slug) ??
    resolveBrandLogoSrc(brand?.name) ??
    resolveBrandLogoSrc(fallbackLabel)
  const label = brand?.name?.trim() || fallbackLabel?.trim() || null

  if (logoSrc) {
    const h = HEIGHT[size]
    return (
      <span className={cn('inline-flex max-w-full items-center', className)}>
        <img
          src={logoSrc}
          alt={label ?? ''}
          height={h}
          width={Math.round(h * 2.8)}
          decoding="async"
          loading="lazy"
          draggable={false}
          className="max-h-full max-w-[8.5rem] object-contain object-left dark:hidden"
          style={{ height: h, width: 'auto' }}
        />
        {label ? (
          <span
            className={cn(
              'hidden font-sans font-medium tracking-normal text-idl-ink normal-case dark:inline',
              DARK_NAME_CLASS[size],
            )}
          >
            {label}
          </span>
        ) : null}
      </span>
    )
  }

  if (!showNameFallback || !label) return null

  return (
    <span
      className={cn(
        'font-mono uppercase dark:font-sans dark:font-medium dark:normal-case dark:tracking-normal dark:text-idl-ink',
        NAME_CLASS[size],
        className,
      )}
    >
      {label}
    </span>
  )
}
