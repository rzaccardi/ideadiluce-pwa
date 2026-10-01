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
 * Logo catalogo JPG: ritaglia il padding bianco del canvas e applica
 * mix-blend-multiply (via `.idl-brand-logo-img`) per non far “sbordare” l’alone.
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

  return (
    <span
      className={cn(
        'relative inline-block overflow-hidden',
        align === 'center' && 'mx-auto',
        className,
      )}
      style={
        {
          '--brand-logo-h': `${height}px`,
          '--brand-logo-aspect': aspect,
          '--brand-logo-max-w': `${maxWidthRem}rem`,
          width:
            'min(calc(var(--brand-logo-h) * var(--brand-logo-aspect)), var(--brand-logo-max-w), 100%)',
          height:
            'calc(min(calc(var(--brand-logo-h) * var(--brand-logo-aspect)), var(--brand-logo-max-w), 100%) / var(--brand-logo-aspect))',
        } as CSSProperties
      }
    >
      <img
        src={src}
        alt={alt}
        decoding="async"
        loading="lazy"
        draggable={false}
        className="idl-brand-logo-img absolute max-w-none"
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
