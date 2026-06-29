import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { EditorialPage } from '@/views/EditorialPage'

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description:
    'Guide e articoli su luce calda e fredda, trend illuminazione 2024 e design lampade di autore.',
})

export default function Page() {
  return <EditorialPage pageKey="guide" />
}
