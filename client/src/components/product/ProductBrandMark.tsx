import type { ProductBrandDTO } from '@/types/dto'
import { BrandLogoImage } from '@/components/site/brand/BrandLogoImage'
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
  /**
   * Se false, non usa mai l’immagine logo (solo nome testuale).
   * Utile sulle card tecniche: il logo resta solo sulle card arredo.
   */
  showLogo?: boolean
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

function resolveAny(
  mode: 'light' | 'dark',
  brand?: ProductBrandDTO | null,
  fallbackLabel?: string | null,
) {
  return (
    resolveBrandLogo(brand?.slug, mode) ??
    resolveBrandLogo(brand?.name, mode) ??
    resolveBrandLogo(fallbackLabel, mode)
  )
}

/**
 * Logo brand da overlay BO (light/dark) o fallback `/brands/{slug}.jpg`.
 * Con logo: stessa immagine (o dark dedicato) anche in dark mode: niente nome testuale.
 */
export function ProductBrandMark({
  brand,
  fallbackLabel,
  size = 'sm',
  className,
  showNameFallback = true,
  showLogo = true,
}: Props) {
  const light = showLogo ? resolveAny('light', brand, fallbackLabel) : null
  const dark = showLogo ? resolveAny('dark', brand, fallbackLabel) : null
  const label = brand?.name?.trim() || fallbackLabel?.trim() || null
  const h = HEIGHT[size]

  // Stesso asset light/dark (es. JPG statico): un solo img, nessuna swap.
  if (light && dark && light.src === dark.src) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-start',
          className,
        )}
      >
        <BrandLogoImage logo={light} alt={label ?? ''} height={h} />
      </span>
    )
  }

  if (light || dark) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-start',
          className,
        )}
      >
        {light ? (
          <span className={dark && dark.src !== light.src ? 'dark:hidden' : undefined}>
            <BrandLogoImage logo={light} alt={label ?? ''} height={h} />
          </span>
        ) : null}
        {dark && (!light || dark.src !== light.src) ? (
          <span className={light ? 'hidden dark:contents' : undefined}>
            <BrandLogoImage logo={dark} alt={label ?? ''} height={h} />
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
