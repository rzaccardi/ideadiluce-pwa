'use client'

import { motion, useReducedMotion } from '@/lib/motion-client'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  children: ReactNode
  className?: string
  /** Quanto sollevare in px al hover */
  lift?: number
}

export function HoverLift({ children, className, lift = 4 }: Props) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      whileHover={{ y: -lift, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
    </motion.div>
  )
}
