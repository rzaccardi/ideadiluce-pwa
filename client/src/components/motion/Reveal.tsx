'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { defaultViewport, fadeUpVariants, transitionBase } from '@/lib/motion/presets'
import { cn } from '@/utils/cn'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  /** Above-the-fold: anima al mount invece di attendere IntersectionObserver */
  immediate?: boolean
}

/** Entra in scena allo scroll — una sola volta per sezione */
export function Reveal({ children, className, delay = 0, immediate = false }: Props) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate={immediate ? 'visible' : undefined}
      whileInView={immediate ? undefined : 'visible'}
      viewport={immediate ? undefined : defaultViewport}
      variants={fadeUpVariants}
      transition={{ ...transitionBase, delay }}
    >
      {children}
    </motion.div>
  )
}
