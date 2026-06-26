'use client'

import { PageTransitionPage } from '@/components/motion/PageTransition'

/** Tutte le pagine storefront sono full-bleed; ogni sezione usa SectionContainer internamente. */
export default function StorefrontTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransitionPage>{children}</PageTransitionPage>
}
