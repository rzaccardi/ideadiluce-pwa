import type { ProductBrandDTO } from '@/types/dto'
import { BrandCatalogLogo } from '@/components/site/brand/BrandCatalogLogo'
import { resolveBrandLogo } from '@/lib/brand-logo'
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
  const logo =
    resolveBrandLogo(brand?.slug) ??
    resolveBrandLogo(brand?.name) ??
    resolveBrandLogo(fallbackLabel)
  const label = brand?.name?.trim() || fallbackLabel?.trim() || null

  if (logo) {
    const h = HEIGHT[size]
    return (
      <span className={cn('inline-flex max-w-full items-center justify-start', className)}>
        <BrandCatalogLogo
          src={logo.src}
          alt={label ?? ''}
          height={h}
          content={logo.content}
          className="dark:hidden"
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
