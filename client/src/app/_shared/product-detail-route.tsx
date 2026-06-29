import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailPage } from '@/views/ProductDetailPage'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchProductDetailServer } from '@/lib/server-catalog'
import { buildMetadata, buildProductJsonLd, buildProductPageUrl, productSeoFromDto } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const data = await fetchProductDetailServer(slug, locale)
  if (!data) return { title: 'Prodotto non trovato' }

  const seo = productSeoFromDto(data.product.seo, data.product.name)
  return buildMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    noindex: seo.noindex,
    alternates: data.product.alternates,
    ogImage: data.product.images[0] ?? data.product.imageUrl,
  })
}

export default async function ProductDetailRoute({ params }: PageProps) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const data = await fetchProductDetailServer(slug, locale)
  if (!data) notFound()

  const seo = productSeoFromDto(data.product.seo, data.product.name)
  const pageUrl = seo.canonical ?? buildProductPageUrl(slug, locale)

  return (
    <>
      <JsonLd data={buildProductJsonLd(data.product, pageUrl)} />
      <ProductDetailPage
        slug={slug}
        initialProduct={data.product}
        initialRelatedProducts={data.relatedProducts}
      />
    </>
  )
}
