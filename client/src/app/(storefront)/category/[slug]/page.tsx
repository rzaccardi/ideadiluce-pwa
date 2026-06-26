import type { Metadata } from 'next'
import { CategoryPage } from '@/views/CategoryPage'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import {
  buildLocalizedPageSeo,
  categorySeoPath,
} from '@/lib/seo-paths'
import { fetchCategoryMetaServer } from '@/lib/server-catalog'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const category = await fetchCategoryMetaServer(slug, locale)
  const name = category?.name ?? slug
  const { canonical, alternates } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => categorySeoPath(slug),
  })
  return buildMetadata({
    title: `${name} | Idea di Luce`,
    description: `Scopri i prodotti nella categoria ${name} su Idea di Luce.`,
    canonical,
    alternates,
  })
}

export default function Page() {
  return <CategoryPage />
}
