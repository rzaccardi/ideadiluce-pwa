'use client'

import { useEffect, useState } from 'react'

/** Vicino al top della pagina l'header resta sempre espanso. */
const TOP_REVEAL_PX = 24
/** Ignora micro-movimenti (trackpad / bounce). */
const DELTA_PX = 8

/**
 * true = chrome secondario nascosto (utility, nav, banner).
 * Scroll down → collapse; scroll up → expand.
 */
export function useHeaderChromeCollapse() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY)
    let ticking = false

    const update = () => {
      const y = Math.max(0, window.scrollY)
      const delta = y - lastY

      if (y <= TOP_REVEAL_PX) {
        setCollapsed(false)
      } else if (delta > DELTA_PX) {
        setCollapsed(true)
      } else if (delta < -DELTA_PX) {
        setCollapsed(false)
      }

      lastY = y
      ticking = false
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
