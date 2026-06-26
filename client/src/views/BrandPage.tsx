'use client'

import { BrandView } from '@/components/site/brand'
import { SeoHead } from '@/components/SeoHead'

export function BrandPage() {
  return (
    <>
      <SeoHead
        title="Brand di illuminazione | Idea di Luce"
        description="Scopri i marchi selezionati: design, lampadine, LED, prodotti tecnici e illuminazione decorativa."
      />
      <BrandView />
    </>
  )
}
