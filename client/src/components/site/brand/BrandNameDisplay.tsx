import type { BrandDisplayStyle } from '@/lib/brand.defaults'
import { resolveBrandLogoSrc } from '@/lib/brand-logo'
import { cn } from '@/utils/cn'

type Props = {
  name: string
  style: BrandDisplayStyle
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Slug catalogo: se c’è asset in `/brands`, mostra il logo ufficiale. */
  slug?: string | null
}

const LOGO_HEIGHT = { sm: 28, md: 36, lg: 48 } as const

export function BrandNameDisplay({ name, style, size = 'md', className, slug }: Props) {
  // TLB: wordmark vettoriale dedicato (meglio del JPG catalogo).
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

  const logoSrc = resolveBrandLogoSrc(slug) ?? resolveBrandLogoSrc(name)
  if (logoSrc) {
    const h = LOGO_HEIGHT[size]
    return (
      <img
        src={logoSrc}
        alt={name}
        height={h}
        width={Math.round(h * 2.8)}
        decoding="async"
        loading="lazy"
        className={cn('max-w-full w-auto object-contain', className)}
        style={{ height: h }}
        draggable={false}
      />
    )
  }

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
