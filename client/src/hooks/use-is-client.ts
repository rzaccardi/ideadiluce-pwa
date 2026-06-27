'use client'

import { useEffect, useState } from 'react'

/** True solo dopo il mount client — evita mismatch hydration con createPortal. */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
