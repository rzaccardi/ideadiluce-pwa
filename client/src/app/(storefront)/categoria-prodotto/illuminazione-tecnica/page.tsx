import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'

export const metadata: Metadata = buildMetadata({
  title: 'Illuminazione tecnica — Idea di Luce',
  description:
    'Lampadine, alimentatori, driver e accessori tecnici. Filtra per tecnologia, attacco, potenza e marca.',
})

export default function Page() {
  return <ProductCategoryLandingPage pageKey="technical" />
}
