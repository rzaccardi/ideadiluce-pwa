import type { Metadata } from 'next'
import { buildLegacySeoMetadata } from '@/lib/legacy-seo-pages'
import { EditorialPage } from '@/views/EditorialPage'

export async function generateMetadata(): Promise<Metadata> {
  return buildLegacySeoMetadata('blog')
}

export default function Page() {
  return <EditorialPage pageKey="guide" />
}
