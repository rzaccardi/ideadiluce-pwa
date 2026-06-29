import type { Metadata } from 'next'
import { buildCategoryLandingMetadata } from '@/lib/seo/landing-metadata'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  return buildCategoryLandingMetadata({
    title: 'Illuminazione tecnica',
    description:
      'Lampadine, alimentatori, driver e accessori tecnici. Filtra per tecnologia, attacco, potenza e marca.',
    path: '/categoria-prodotto/illuminazione-tecnica',
    searchParams: params,
  })
}

export default function Page() {
  return <ProductCategoryLandingPage pageKey="technical" />
}
