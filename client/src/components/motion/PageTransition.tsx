'use client'

import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import { usePathname } from '@/lib/navigation'
import {
  pageTransitionTiming,
  pageTransitionVariants,
  resolvePageTransitionKind,
} from '@/lib/motion/page-transitions'

/**
 * Wrapper persistente nel layout: deve avvolgere direttamente il template
 * (motion.div keyed) per far funzionare le exit animation con App Router.
 */
export function PageTransitionShell({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <>{children}</>
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {children}
    </AnimatePresence>
  )
}

/**
 * Wrapper nel template.tsx: si remonta a ogni navigazione così AnimatePresence
 * può animare l'uscita della pagina precedente senza flicker sui children.
 */
export function PageTransitionPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const kind = resolvePageTransitionKind(pathname)
  const variants = pageTransitionVariants[kind]
  const transition = pageTransitionTiming[kind]

  if (reduceMotion || kind === 'catalog' || kind === 'checkout') {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>
  }

  return (
    <motion.div
      key={pathname}
      className="flex min-h-full flex-1 flex-col will-change-[opacity,transform]"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      transition={transition}
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
