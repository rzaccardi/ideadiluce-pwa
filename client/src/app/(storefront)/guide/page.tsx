import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { EditorialPage } from '@/views/EditorialPage'

export const metadata: Metadata = buildMetadata({
  title: 'Guide alla luce | Idea di Luce',
  description: 'Guide pratiche su attacchi, temperatura colore e scelta delle lampadine.',
})

export default function Page() {
  return <EditorialPage pageKey="guide" />
}
