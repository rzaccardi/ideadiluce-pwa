import type { Metadata } from 'next'
import { buildCategoryLandingMetadata } from '@/lib/seo/landing-metadata'
import { CategoryLandingRoutePage } from '@/app/_shared/category-landing-route'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  return buildCategoryLandingMetadata({
    title: 'Prodotti tecnici',
    description:
      'Alimentatori, driver LED, trasformatori, portalampade e accessori. Filtra per tecnologia, potenza, corrente e attacco.',
    path: '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici',
    searchParams: params,
  })
}

export default function Page() {
  return <CategoryLandingRoutePage pageKey="technical-products" />
}
