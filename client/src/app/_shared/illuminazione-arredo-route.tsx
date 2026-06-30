import type { Metadata } from 'next'
import { getLegacySeoPage } from '@/lib/legacy-seo-pages'
import { buildCategoryLandingMetadata } from '@/lib/seo/landing-metadata'
import { CategoryLandingRoutePage } from '@/app/_shared/category-landing-route'

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

export async function IlluminazioneArredoRoutePage() {
  return <CategoryLandingRoutePage pageKey="design" />
}
