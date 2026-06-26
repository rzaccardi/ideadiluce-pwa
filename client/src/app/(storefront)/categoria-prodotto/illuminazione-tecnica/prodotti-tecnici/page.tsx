import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'

export const metadata: Metadata = buildMetadata({
  title: 'Prodotti tecnici — Idea di Luce',
  description:
    'Alimentatori, driver LED, trasformatori, portalampade e accessori. Filtra per tecnologia, potenza, corrente e attacco.',
})

export default function Page() {
  return <ProductCategoryLandingPage pageKey="technical-products" />
}
