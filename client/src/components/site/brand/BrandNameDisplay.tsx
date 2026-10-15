import type { BrandDisplayStyle } from '@/lib/brand.defaults'
import { BrandLogoImage } from '@/components/site/brand/BrandLogoImage'
import { resolveBrandLogo } from '@/lib/brand-logo'
import { cn } from '@/utils/cn'

type Props = {
  name: string
  style: BrandDisplayStyle
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Slug catalogo: se c’è asset in `/brands` o overlay BO, mostra il logo ufficiale. */
  slug?: string | null
}

const LOGO_HEIGHT = { sm: 28, md: 36, lg: 48 } as const

export function BrandNameDisplay({ name, style, size = 'md', className, slug }: Props) {
  // TLB: wordmark vettoriale dedicato (meglio del JPG catalogo) — anche in dark.
  if (style === 'bold-accent' && name.toLowerCase().includes('tlb')) {
    const h = LOGO_HEIGHT[size]
    return (
      <img
        src="/brand/tlb.svg"
        alt="TLB Italy"
        height={h}
        width={Math.round(h * 1.32)}
        decoding="async"
        className={cn('w-auto object-contain', className)}
        style={{ height: h }}
        draggable={false}
      />
    )
  }

  const light = resolveBrandLogo(slug, 'light') ?? resolveBrandLogo(name, 'light')
  const dark = resolveBrandLogo(slug, 'dark') ?? resolveBrandLogo(name, 'dark')
  if (light || dark) {
    const h = LOGO_HEIGHT[size]

    if (light && dark && light.src === dark.src) {
      return (
        <BrandLogoImage
          logo={light}
          alt={name}
          height={h}
          align="center"
          maxWidthRem={10}
          className={className}
        />
      )
    }

    return (
      <>
        {light ? (
          <span className={dark && dark.src !== light.src ? 'dark:hidden' : undefined}>
            <BrandLogoImage
              logo={light}
              alt={name}
              height={h}
              align="center"
              maxWidthRem={10}
              className={className}
            />
          </span>
        ) : null}
        {dark && (!light || dark.src !== light.src) ? (
          <span className={light ? 'hidden dark:inline-flex' : undefined}>
            <BrandLogoImage
              logo={dark}
              alt={name}
              height={h}
              align="center"
              maxWidthRem={10}
              className={className}
            />
          </span>
        ) : null}
      </>
    )
  }

  // Senza logo: nome testuale in light e dark.
  if (style === 'serif') {
    return (
      <span
        className={cn(
          'font-serif font-medium tracking-wide text-idl-graphite',
          size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-2xl' : 'text-lg',
          name === 'FontanaArte' && 'text-[21px]',
          name === 'Davide Groppi' && 'text-lg',
          className,
        )}
      >
        {name}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'font-extrabold tracking-wide text-idl-graphite uppercase',
        size === 'lg' ? 'text-[30px]' : size === 'md' ? 'text-xl' : 'text-base',
        name === 'Ledvance' && 'text-[19px]',
        name === 'Mean Well' && 'text-lg',
        className,
      )}
    >
      {name}
    </span>
  )
}
