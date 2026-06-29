import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/env'
import { getRequestLocale } from '@/lib/locale-server'
import { buildLegacySeoMetadata } from '@/lib/legacy-seo-pages'
import { fetchHomeContentServer } from '@/lib/server-site'
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { HomePage } from '@/views/HomePage'

export async function generateMetadata(): Promise<Metadata> {
  return buildLegacySeoMetadata('home', {
    title: 'Home — Illumina con stile',
    description: 'La luce pensata. Illuminazione per casa e professionisti.',
  })
}

export default async function Page() {
  const locale = await getRequestLocale()
  const initialContent = await fetchHomeContentServer(locale)
  const site = getSiteUrl()

  return (
    <>
      <JsonLdGraph
        items={[buildOrganizationJsonLd(site), buildWebSiteJsonLd(site)]}
      />
      <HomePage initialContent={initialContent} />
    </>
  )
}
