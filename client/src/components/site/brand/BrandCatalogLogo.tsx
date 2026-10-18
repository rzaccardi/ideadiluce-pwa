import type { CSSProperties } from 'react'
import {
  brandLogoContentAspect,
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
 * Dimensioni in px (niente `width: … 100%`): in flex/inline-flex la % ciclica
 * collassa il box a 0 e i loghi spariscono sopra il titolo prodotto.
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
  const [x0, y0, x1, y1] = content
  const cw = Math.max(0.01, x1 - x0)
  const ch = Math.max(0.01, y1 - y0)
  const aspect = brandLogoContentAspect(content)
  const widthPx = Math.min(height * aspect, maxWidthRem * 16)

  return (
    <span
      className={cn(
        'relative inline-block max-w-full shrink-0 overflow-hidden',
        align === 'center' && 'mx-auto',
        className,
      )}
      style={
        {
          width: widthPx,
          maxWidth: '100%',
          aspectRatio: aspect,
        } as CSSProperties
      }
    >
      <img
        src={src}
        alt={alt}
        decoding="async"
        loading="lazy"
        draggable={false}
        className="absolute max-w-none"
        style={{
          height: `${(1 / ch) * 100}%`,
          width: 'auto',
          left: `${(-x0 / cw) * 100}%`,
          top: `${(-y0 / ch) * 100}%`,
        }}
      />
    </span>
  )
}
