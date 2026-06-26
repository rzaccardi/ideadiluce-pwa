'use client'

import { AttaccoView } from '@/components/site/attacco'
import { FadeIn } from '@/components/motion'
import { SeoHead } from '@/components/SeoHead'

export function AttaccoPage() {
  return (
    <FadeIn>
      <>
        <SeoHead
          title="Scegli per attacco | Idea di Luce"
          description="Trova lampadine e ricambi per attacco: E27, GU10, R7s, G9 e altri. Wizard guidato e ricerca in linguaggio naturale."
        />
        <AttaccoView />
      </>
    </FadeIn>
  )
}
