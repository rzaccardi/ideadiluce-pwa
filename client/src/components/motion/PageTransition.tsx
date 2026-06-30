'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import { usePathname } from '@/lib/navigation'
import {
  pageTransitionVariants,
  resolvePageTransitionKind,
} from '@/lib/motion/page-transitions'

const PAGE_LAYOUT_CLASS = 'flex min-h-full w-full flex-1 flex-col'

/**
 * Wrapper persistente nel layout: AnimatePresence con `popLayout` anima l'uscita
 * senza bloccare l'ingresso (a differenza di `mode="wait"` con App Router).
 */
export function PageTransitionShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={`page-transition-root ${PAGE_LAYOUT_CLASS}`}>{children}</div>
  }

  return (
    <div className="page-transition-root relative flex min-h-0 flex-1 flex-col">
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  )
}

/**
 * Wrapper nel template.tsx: varianti per contesto (editorial, catalogo, prodotto…).
 */
export function PageTransitionPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const kind = resolvePageTransitionKind(pathname)
  const variants = pageTransitionVariants[kind]

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  if (reduceMotion) {
    return <div className={PAGE_LAYOUT_CLASS}>{children}</div>
  }

  return (
    <motion.div
      key={pathname}
      className={`${PAGE_LAYOUT_CLASS} will-change-[opacity,transform]`}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

/** @deprecated Usa PageTransitionShell + PageTransitionPage con template.tsx */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <PageTransitionShell>
      <PageTransitionPage>{children}</PageTransitionPage>
    </PageTransitionShell>
  )
}
