'use client'

import { useEffect } from 'react'
import { usePathname } from '@/lib/navigation'

const PAGE_LAYOUT_CLASS = 'flex min-h-full w-full flex-1 flex-col'

/** Contenitore pagina senza animazione di ingresso/uscita. */
export function PageTransitionShell({ children }: { children: React.ReactNode }) {
  return <div className={`page-transition-root ${PAGE_LAYOUT_CLASS}`}>{children}</div>
}

/** Scroll top al cambio route; nessun fade/slide tra pagine. */
export function PageTransitionPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return <div className={PAGE_LAYOUT_CLASS}>{children}</div>
}

/** @deprecated Usa PageTransitionShell + PageTransitionPage con template.tsx */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <PageTransitionShell>
      <PageTransitionPage>{children}</PageTransitionPage>
    </PageTransitionShell>
  )
}
