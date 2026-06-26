import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { BrandPage } from '@/views/BrandPage'

export const metadata: Metadata = buildMetadata({
  title: 'Brand di illuminazione | Idea di Luce',
  description: 'Scopri i marchi di arredo e tecnica disponibili su Idea di Luce.',
})

export default function Page() {
  return <BrandPage />
}
