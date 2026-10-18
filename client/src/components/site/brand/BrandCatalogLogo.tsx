import {
  brandLogoCropLayout,
  type BrandLogoContentBox,
} from '@/lib/brand-logo'
import { cn } from '@/utils/cn'

type Props = {
  src: string
  alt: string
  height: number
  content: BrandLogoContentBox
  className?: string
  /** Allineamento del wordmark nel box (default left, come sulle card prodotto). */
  align?: 'left' | 'center'
  maxWidthRem?: number
}

/**
 * Logo catalogo JPG: ritaglia il padding bianco del canvas via bbox contenuto.
 * Niente mix-blend: con parent animati (opacity/transform) il multiply
 * isolerebbe i wordmark e li renderebbe invisibili su fondi chiari.
 *
 * Larghezza e altezza solo in px, anche sull’img. `max-width: 100%`,
 * `aspect-ratio` e `width: auto` dentro flex o sotto un `transform`
 * collassano il marchio a 0×N e sopra il titolo non resta nulla.
 */
export function BrandCatalogLogo({
  src,
  alt,
  height,
  content,
  className,
  align = 'left',
  maxWidthRem = 8.5,
}: Props) {
  const layout = brandLogoCropLayout(height, content, maxWidthRem)

  return (
    <span
      className={cn(
        'relative inline-block shrink-0 overflow-hidden',
        align === 'center' && 'mx-auto',
        className,
      )}
      style={{
        width: layout.boxWidth,
        height: layout.boxHeight,
        minWidth: layout.boxWidth,
        minHeight: layout.boxHeight,
      }}
    >
      <img
        src={src}
        alt={alt}
        width={Math.round(layout.imgWidth)}
        height={Math.round(layout.imgHeight)}
        decoding="async"
        draggable={false}
        className="absolute max-w-none"
        style={{
          width: layout.imgWidth,
          height: layout.imgHeight,
          maxWidth: 'none',
          left: layout.imgLeft,
          top: layout.imgTop,
        }}
      />
    </span>
  )
}
