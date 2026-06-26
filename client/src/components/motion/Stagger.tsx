'use client'

import { motion, useReducedMotion } from '@/lib/motion-client'
import type { ReactNode } from 'react'
import { defaultViewport, fadeUpVariants, staggerContainer, transitionBase } from '@/lib/motion/presets'
import { cn } from '@/utils/cn'

type StaggerProps = {
  children: ReactNode
  className?: string
  stagger?: number
  delayChildren?: number
  immediate?: boolean
}

export function Stagger({
  children,
  className,
  stagger = 0.07,
  delayChildren = 0,
  immediate = false,
}: StaggerProps) {
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
      variants={staggerContainer(stagger, delayChildren)}
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={cn(className)} variants={fadeUpVariants} transition={transitionBase}>
      {children}
    </motion.div>
  )
}
