'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { isCookiebotEnabled, runCookiebotScripts } from '@/lib/cookiebot'

/** Cookiebot SPA: riesegue script consentiti dopo ogni cambio route. */
export function CookiebotRouteSync() {
  const pathname = usePathname()

  useEffect(() => {
    if (!isCookiebotEnabled()) return
    runCookiebotScripts()
  }, [pathname])

  return null
}
