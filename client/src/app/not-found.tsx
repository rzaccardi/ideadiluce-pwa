import type { Metadata } from 'next'
import { NotFoundPage } from '@/views/NotFoundPage'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Pagina non trovata',
  noindex: true,
})

export default function NotFound() {
  return <NotFoundPage />
}
