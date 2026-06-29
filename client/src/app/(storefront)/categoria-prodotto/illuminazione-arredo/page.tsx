import type { Metadata } from 'next'
import { buildCategoryLandingMetadata } from '@/lib/seo/landing-metadata'
import { ProductCategoryLandingPage } from '@/views/ProductCategoryLandingPage'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  return buildCategoryLandingMetadata({
    title: "Illuminazione d'arredo",
    description:
      "Lampade, sospensioni, applique e soluzioni decorative selezionate per dare carattere agli ambienti.",
    path: '/categoria-prodotto/illuminazione-arredo',
    searchParams: params,
  })
}

export default function Page() {
  return <ProductCategoryLandingPage pageKey="design" />
}
