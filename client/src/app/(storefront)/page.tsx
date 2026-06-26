import type { Metadata } from 'next'
import { t } from '@/i18n/messages'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchHomeContentServer } from '@/lib/server-site'
import { buildMetadata } from '@/lib/seo'
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

  return <HomePage initialContent={initialContent} />
}
