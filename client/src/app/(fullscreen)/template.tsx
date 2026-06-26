'use client'

import { PageTransitionPage } from '@/components/motion/PageTransition'

export default function FullscreenTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransitionPage>{children}</PageTransitionPage>
}
