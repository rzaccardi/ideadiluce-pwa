'use client'

// Next.js non risolve i re-export wildcard di `motion/react` (solo `m`/`motion`).
export {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'framer-motion'

export type { Transition, Variants } from 'framer-motion'
