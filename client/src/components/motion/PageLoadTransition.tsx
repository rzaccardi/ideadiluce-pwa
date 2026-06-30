'use client'

import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import type { ReactNode } from 'react'
import { fadeUpVariants } from '@/lib/motion/presets'
import { PAGE_FLEX_LAYOUT_CLASS } from '@/components/layout/PageFlexShell'
import { cn } from '@/utils/cn'

type Props = {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Crossfade skeleton → contenuto: le query partono subito; l'animazione non ritarda il render dei dati.
 * Con `popLayout` il contenuto appare appena pronto, senza attendere la fine dell'uscita dello skeleton.
 */
export function PageLoadTransition({
  isLoading,
  skeleton,
  children,
  className,
}: Props) {
  const reduceMotion = useReducedMotion()
  const layoutClass = cn(PAGE_FLEX_LAYOUT_CLASS, className)
  const showSkeleton = isLoading && children == null
  const showContent = children != null

  if (reduceMotion) {
    return (
      <div className={layoutClass}>
        {showSkeleton ? skeleton : children}
      </div>
    )
  }

  return (
    <div className={cn(layoutClass, 'relative')}>
      <AnimatePresence mode="popLayout" initial={false}>
        {showSkeleton ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {skeleton}
          </motion.div>
        ) : null}
        {showContent ? (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0 }}
            variants={fadeUpVariants}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
