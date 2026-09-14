'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/cn'
import { IdlMediaPlaceholder } from '@/components/site/IdlMediaPlaceholder'

type Props = {
  src: string
  alt?: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  /** Logo al posto dell'immagine se il file non carica (default: sì). */
  showPlaceholderOnError?: boolean
  onError?: () => void
}

const ODOO_IMAGE_PATTERN = /^https:\/\/[^/]+\.odoo\.com\/web\/image\//

function isOptimizableRemote(src: string) {
  return ODOO_IMAGE_PATTERN.test(src)
}

/** Immagini locali e Odoo via next/image; altri URL esterni via img nativo. */
export function SiteImage({
  src,
  alt = '',
  className,
  fill,
  sizes,
  priority,
  showPlaceholderOnError = true,
  onError,
}: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const hideUntilLoaded = !(src.startsWith('/') || isOptimizableRemote(src))

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [src])

  function handleError() {
    setFailed(true)
    onError?.()
  }

  if (!src) return null

  if (failed) {
    if (!showPlaceholderOnError) return null
    return <IdlMediaPlaceholder fill={Boolean(fill)} />
  }

  const visibilityClass = hideUntilLoaded && !loaded ? 'pointer-events-none opacity-0' : null

  if (src.startsWith('/') || isOptimizableRemote(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={cn(className, visibilityClass)}
        onError={handleError}
        onLoad={() => setLoaded(true)}
      />
    )
  }

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn('absolute inset-0 size-full object-cover', className, visibilityClass)}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onError={handleError}
        onLoad={() => setLoaded(true)}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(className, visibilityClass)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      onError={handleError}
      onLoad={() => setLoaded(true)}
    />
  )
}
