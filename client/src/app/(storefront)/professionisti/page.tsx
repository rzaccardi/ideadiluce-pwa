import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchProfessionistiContentServer } from '@/lib/server-site'
import { buildMetadata } from '@/lib/seo'
import { ProfessionistiPage } from '@/views/ProfessionistiPage'

export const metadata: Metadata = buildMetadata({
  title: 'Area professionisti | Idea di Luce',
  description:
    'Prezzi B2B, riordino rapido da codice o EAN, preventivi e supporto su ricambi per installatori, architetti e aziende.',
})

export default async function Page() {
  const locale = await getRequestLocale()
  const initialContent = await fetchProfessionistiContentServer(locale)

  return <ProfessionistiPage initialContent={initialContent} />
}
