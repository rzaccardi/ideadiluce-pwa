'use client'

import { useEffect, useState } from 'react'

/** In cima alla pagina l'header resta espanso. */
const TOP_REVEAL_PX = 48
/** Scroll down accumulato prima di collassare. */
const COLLAPSE_PX = 24
/**
 * Dopo il collapse ignora nuovi scroll down:
 * evita un secondo toggle mentre lo chrome anima (300ms) e sposta il layout.
 */
const LOCK_MS = 360

/**
 * true = chrome secondario nascosto (utility, nav, banner).
 * Scroll down → collapse. Resta compatto finché non si torna in cima:
 * niente riapertura a metà pagina, che faceva flippare l'header.
 */
export function useHeaderChromeCollapse() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY)
    let accumulated = 0
    let lockedUntil = 0
    let isCollapsed = false
    let ticking = false

    const apply = (next: boolean) => {
      if (isCollapsed === next) return
      isCollapsed = next
      lockedUntil = performance.now() + LOCK_MS
      accumulated = 0
      setCollapsed(next)
      requestAnimationFrame(() => {
        lastY = Math.max(0, window.scrollY)
      })
    }

    const update = () => {
      const y = Math.max(0, window.scrollY)
      const delta = y - lastY
      lastY = y
      ticking = false

      if (y <= TOP_REVEAL_PX) {
        accumulated = 0
        apply(false)
        return
      }

      if (!isCollapsed) {
        if (performance.now() < lockedUntil) {
          accumulated = 0
          return
        }
        if (delta > 0) accumulated += delta
        else accumulated = 0
        if (accumulated >= COLLAPSE_PX) apply(true)
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return collapsed
}
