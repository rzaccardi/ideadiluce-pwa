import type { Transition, Variants } from 'motion/react'

/** Curva ease-out premium — coerente con il design IdeaDiLuce */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const transitionFast: Transition = { duration: 0.18, ease: EASE_OUT }
export const transitionBase: Transition = { duration: 0.28, ease: EASE_OUT }
export const transitionSlow: Transition = { duration: 0.42, ease: EASE_OUT }

export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
}

export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

export const staggerContainer = (stagger = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

export const defaultViewport = { once: true, margin: '-48px' as const }
