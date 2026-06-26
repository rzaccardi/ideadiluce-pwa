'use client'

import Image from 'next/image'
import { cn } from '@/utils/cn'

type Props = {
  src: string
  alt?: string
  className?: string
  fill?: boolean
  sizes?: string
}

/** Immagini locali via next/image; URL esterni (Odoo/CDN) via img nativo. */
export function SiteImage({ src, alt = '', className, fill, sizes }: Props) {
  if (!src) return null

  if (src.startsWith('/')) {
    return <Image src={src} alt={alt} fill={fill} sizes={sizes} className={className} />
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('absolute inset-0 size-full object-cover', className)}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
}
