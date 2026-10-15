import type { ResolvedBrandLogo } from '@/lib/brand-logo'
import { BrandCatalogLogo } from '@/components/site/brand/BrandCatalogLogo'
import { cn } from '@/utils/cn'

type Props = {
  logo: ResolvedBrandLogo
  alt: string
  height: number
  className?: string
  align?: 'left' | 'center'
  maxWidthRem?: number
}

/**
 * Logo brand: crop JPG statico oppure img object-contain per asset gestiti (PNG CDN).
 */
export function BrandLogoImage({
  logo,
  alt,
  height,
  className,
  align = 'left',
  maxWidthRem = 8.5,
}: Props) {
  if (logo.source === 'managed') {
    return (
      <span
        className={cn(
          'inline-flex max-w-full items-center',
          align === 'center' && 'mx-auto justify-center',
          className,
        )}
        style={{ height, maxWidth: `${maxWidthRem}rem` }}
      >
        <img
          src={logo.src}
          alt={alt}
          decoding="async"
          loading="lazy"
          draggable={false}
          className="h-full w-auto max-w-full object-contain"
        />
      </span>
    )
  }

  return (
    <BrandCatalogLogo
      src={logo.src}
      alt={alt}
      height={height}
      content={logo.content}
      className={className}
      align={align}
      maxWidthRem={maxWidthRem}
    />
  )
}
