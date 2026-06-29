import type { Metadata } from 'next'
import { getLegacySeoPage } from '@/lib/legacy-seo-pages'
import { buildCategoryLandingMetadata } from '@/lib/seo/landing-metadata'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateIlluminazioneArredoMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const legacy = getLegacySeoPage('illuminazione-arredo')
  return buildCategoryLandingMetadata({
    title: legacy.title,
    description: legacy.description,
    path: legacy.canonicalPath,
    searchParams: params,
  })
}

export function IlluminazioneArredoRoutePage() {
  return <ProductCategoryLandingPage pageKey="design" />
}
