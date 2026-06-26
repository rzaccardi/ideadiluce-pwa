import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'

export const metadata: Metadata = buildMetadata({
  title: "Illuminazione d'arredo — Idea di Luce",
  description:
    "Lampade, sospensioni, applique e soluzioni decorative selezionate per dare carattere agli ambienti.",
})

export default function Page() {
  return <ProductCategoryLandingPage pageKey="design" />
}
