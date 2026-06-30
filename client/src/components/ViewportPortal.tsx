'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useIsClient } from '@/hooks/use-is-client'

type Props = {
  open: boolean
  children: ReactNode
  /** Blocca lo scroll del body mentre il portal è aperto. */
  lockScroll?: boolean
}

/**
 * Monta i figli su `document.body` così `position: fixed` resta ancorato al viewport
 * (evita antenati con transform da PageTransition / motion).
 */
export function ViewportPortal({ open, children, lockScroll = false }: Props) {
  const isClient = useIsClient()

  useEffect(() => {
    if (!open || !lockScroll) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, lockScroll])

  if (!open || !isClient) return null

  return createPortal(children, document.body)
}
