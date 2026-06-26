'use client'

import { motion, useReducedMotion } from '@/lib/motion-client'
import type { ReactNode } from 'react'
import { fadeInVariants, fadeUpVariants, transitionBase } from '@/lib/motion/presets'
import { cn } from '@/utils/cn'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  /** fade = solo opacità, rise = fade + slide up */
  variant?: 'fade' | 'rise'
}

export function FadeIn({ children, className, delay = 0, variant = 'rise' }: Props) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={variant === 'fade' ? fadeInVariants : fadeUpVariants}
      transition={{ ...transitionBase, delay }}
    >
      {children}
    </motion.div>
  )
}
