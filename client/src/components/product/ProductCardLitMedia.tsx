'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
 * Il packshot resta visibile finché l'immagine accesa non è caricata,
 * così aprire una sezione non lascia card "spente" per secondi.
 */
export function ProductCardLitMedia({
  imageUrl,
  hoverImageUrl,
  accesaImageUrl,
  slug,
  sizes,
  imageClassName = 'object-cover object-center',
}: Props) {
  const { on: lightsOn, waveNonce } = useSnapshot(lightsStore)
  const reduceMotion = useReducedMotion()
  const [litLoaded, setLitLoaded] = useState(false)
  const [waveReady, setWaveReady] = useState(true)
  const mountedWaveRef = useRef(waveNonce)

  useLayoutEffect(() => {
    hydrateLightsStore()
  }, [])

  const litSrc =
    accesaImageUrl && !odooCatalogImageUrlsMatch(accesaImageUrl, imageUrl) ? accesaImageUrl : null
  const hoverSrc =
    hoverImageUrl && !odooCatalogImageUrlsMatch(hoverImageUrl, imageUrl) ? hoverImageUrl : null
  const lightsActive = Boolean(lightsOn && litSrc)
  const overlaySrc = lightsActive ? litSrc : hoverSrc
  const isToggleWave = lightsActive && waveNonce !== mountedWaveRef.current

  useEffect(() => {
    setLitLoaded(false)
  }, [litSrc])

  useEffect(() => {
    if (!lightsActive || !isToggleWave || reduceMotion) {
      setWaveReady(true)
      mountedWaveRef.current = waveNonce
      return
    }
    setWaveReady(false)
    const delayMs = cardLightsDelayMs(slug)
    const timer = window.setTimeout(() => {
      setWaveReady(true)
      mountedWaveRef.current = waveNonce
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [lightsActive, isToggleWave, reduceMotion, slug, waveNonce])

  const revealLit = lightsActive && litLoaded && waveReady
  const durationClass = reduceMotion ? 'duration-0' : 'duration-500'

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
          revealLit && 'opacity-0',
        )}
      >
        <SiteImage src={imageUrl} alt="" fill className={imageClassName} sizes={sizes} />
      </div>
      {overlaySrc ? (
        <div
          data-card-lights={revealLit ? 'on' : 'off'}
          className={cn(
            'absolute inset-0 z-[1] transition-opacity ease-out',
            durationClass,
            revealLit
              ? 'opacity-100'
              : lightsActive
                ? 'opacity-0'
                : 'opacity-0 [@media(hover:hover)]:group-hover:opacity-100',
          )}
        >
          <SiteImage
            src={overlaySrc}
            alt=""
            fill
            className={imageClassName}
            sizes={sizes}
            onLoad={() => {
              if (lightsActive) setLitLoaded(true)
            }}
          />
        </div>
      ) : null}
    </>
  )
}
