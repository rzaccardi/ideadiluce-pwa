'use client'

import Image from 'next/image'
import { cn } from '@/utils/cn'

type Props = {
  src: string
  alt?: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
}

const ODOO_IMAGE_PATTERN = /^https:\/\/[^/]+\.odoo\.com\/web\/image\//

function isOptimizableRemote(src: string) {
  return ODOO_IMAGE_PATTERN.test(src)
}

/** Immagini locali e Odoo via next/image; altri URL esterni via img nativo. */
export function SiteImage({ src, alt = '', className, fill, sizes, priority }: Props) {
  if (!src) return null

  if (src.startsWith('/') || isOptimizableRemote(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={className}
      />
    )
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('absolute inset-0 size-full object-cover', className)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
    />
  )
}
