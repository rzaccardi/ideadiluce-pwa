'use client'

import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import type { ReactNode } from 'react'
import { fadeUpVariants, transitionBase } from '@/lib/motion/presets'
import { PAGE_FLEX_LAYOUT_CLASS } from '@/components/layout/PageFlexShell'
import { cn } from '@/utils/cn'

type Props = {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  /** Intestazione visibile solo durante il caricamento (non duplica il contenuto reale). */
  loadingHeader?: ReactNode
  className?: string
}

/**
 * Crossfade skeleton → contenuto reale dopo le chiamate API.
 * Usare al posto del render condizionale secco skeleton | data.
 */
export function PageLoadTransition({
  isLoading,
  skeleton,
  children,
  loadingHeader,
  className,
}: Props) {
  const reduceMotion = useReducedMotion()
  const layoutClass = cn(PAGE_FLEX_LAYOUT_CLASS, className)

  if (reduceMotion) {
    return (
      <div className={layoutClass}>
        {isLoading ? loadingHeader : null}
        {isLoading ? skeleton : children}
      </div>
    )
  }

  return (
    <div className={layoutClass}>
      {isLoading ? loadingHeader : null}
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            transition={transitionBase}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
