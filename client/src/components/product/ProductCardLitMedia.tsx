'use client'

import { useEffect } from 'react'
import { useSnapshot } from 'valtio/react'
import { useReducedMotion } from '@/lib/motion-client'
import { IdlMediaPlaceholder } from '@/components/site/IdlMediaPlaceholder'
import { SiteImage } from '@/components/site/SiteImage'
import { odooCatalogImageUrlsMatch } from '@/lib/odoo-catalog/media'
import { cardLightsDelayMs, hydrateLightsStore, lightsStore } from '@/features/lights'
import { cn } from '@/utils/cn'

type Props = {
  imageUrl: string | null
  hoverImageUrl?: string | null
  accesaImageUrl?: string | null
  slug?: string | null
  sizes: string
  imageClassName?: string
}

/**
 * Packshot di base; overlay accesa guidato dal toggle globale luci
 * (con hover verso accesa/ambiente quando le luci sono spente).
 */
export function ProductCardLitMedia({
  imageUrl,
  hoverImageUrl,
  accesaImageUrl,
  slug,
  sizes,
  imageClassName = 'object-cover',
}: Props) {
  const { on: lightsOn } = useSnapshot(lightsStore)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    hydrateLightsStore()
  }, [])

  const litSrc =
    accesaImageUrl && !odooCatalogImageUrlsMatch(accesaImageUrl, imageUrl) ? accesaImageUrl : null
  const hoverSrc =
    hoverImageUrl && !odooCatalogImageUrlsMatch(hoverImageUrl, imageUrl) ? hoverImageUrl : null
  const lightsActive = Boolean(lightsOn && litSrc)
  const overlaySrc = lightsActive ? litSrc : hoverSrc
  const delayMs = reduceMotion ? 0 : cardLightsDelayMs(slug)
  const durationClass = reduceMotion
    ? 'duration-0'
    : lightsActive
      ? 'duration-700'
      : 'duration-500'
  const delayStyle = { transitionDelay: `${delayMs}ms` }

  if (!imageUrl) {
    return <IdlMediaPlaceholder fill />
  }

  return (
    <>
      <div
        className={cn(
          'absolute inset-0 transition-opacity ease-out',
          durationClass,
          overlaySrc && !lightsActive
            ? '[@media(hover:hover)]:group-hover:opacity-0'
            : null,
          lightsActive && 'opacity-0',
        )}
        style={lightsActive ? { ...delayStyle, opacity: 0 } : delayStyle}
      >
        <SiteImage src={imageUrl} alt="" fill className={imageClassName} sizes={sizes} />
      </div>
      {overlaySrc ? (
        <div
          data-card-lights={lightsActive ? 'on' : 'off'}
          className={cn(
            'absolute inset-0 z-[1] transition-opacity ease-out',
            durationClass,
            lightsActive ? 'opacity-100' : 'opacity-0 [@media(hover:hover)]:group-hover:opacity-100',
          )}
          style={lightsActive ? { ...delayStyle, opacity: 1 } : delayStyle}
        >
          <SiteImage src={overlaySrc} alt="" fill className={imageClassName} sizes={sizes} />
        </div>
      ) : null}
    </>
  )
}
