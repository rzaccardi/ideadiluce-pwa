import type { Metadata } from 'next'
import { buildLegacySeoMetadata } from '@/lib/legacy-seo-pages'
import { AmbientiPage } from '@/views/AmbientiPage'

export async function generateMetadata(): Promise<Metadata> {
  return buildLegacySeoMetadata('acquista-ambiente')
}

export default function Page() {
  return <AmbientiPage />
}
