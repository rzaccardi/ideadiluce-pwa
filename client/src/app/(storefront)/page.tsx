import type { Metadata } from 'next'
import { t } from '@/i18n/messages'
import { getSiteUrl } from '@/lib/env'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchHomeContentServer } from '@/lib/server-site'
import { buildMetadata, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/seo'
import { JsonLdGraph } from '@/components/JsonLdGraph'
import { HomePage } from '@/views/HomePage'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return buildMetadata({
    title: `${t(locale, 'home.title')} — ${t(locale, 'home.subtitle')}`,
    description: t(locale, 'home.subtitle'),
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
