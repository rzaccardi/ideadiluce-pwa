import type { Metadata } from 'next'
import { CatalogPage } from '@/views/CatalogPage'
import { getRequestLocale } from '@/lib/locale-server'
import { buildMetadata } from '@/lib/seo'
import { brandSeoPath, buildLocalizedPageSeo } from '@/lib/seo-paths'
import { fetchBrandMetaServer } from '@/lib/server-catalog'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const brand = await fetchBrandMetaServer(slug, locale)
  const name = brand?.name ?? slug
  const { canonical, alternates } = buildLocalizedPageSeo({
    currentLocale: locale,
    pathForLocale: () => brandSeoPath(slug),
  })
  return buildMetadata({
    title: `${name} | Idea di Luce`,
    description: `Catalogo prodotti ${name} — lampade e illuminazione su Idea di Luce.`,
    canonical,
    alternates,
  })
}

export default async function BrandSlugPage({ params }: PageProps) {
  const { slug } = await params
  return <CatalogPage forcedBrandSlug={slug} />
}
