import type { Metadata } from 'next'
import { buildLegacySeoMetadata } from '@/lib/legacy-seo-pages'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { isEditorialPage } from '@/lib/site-page-keys'
import type { EditorialPageContent } from '@/types/site-content'
import { AmbientiPage } from '@/views/AmbientiPage'

export async function generateMetadata(): Promise<Metadata> {
  return buildLegacySeoMetadata('acquista-ambiente')
}

export default async function Page() {
  const locale = await getRequestLocale()
  const content = await fetchContentPageServer<EditorialPageContent>('ambienti', locale)
  const initialContent = content && isEditorialPage(content) ? content : null

  return <AmbientiPage initialContent={initialContent} />
}
