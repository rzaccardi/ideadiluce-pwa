import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { isEditorialPage } from '@/lib/site-page-keys'
import type { EditorialPageContent } from '@/types/site-content'
import { EditorialPage } from '@/views/EditorialPage'

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description:
    'Guide e articoli su luce calda e fredda, trend illuminazione 2024 e design lampade di autore.',
})

export default async function Page() {
  const locale = await getRequestLocale()
  const content = await fetchContentPageServer<EditorialPageContent>('guide', locale)
  const initialContent = content && isEditorialPage(content) ? content : null

  return <EditorialPage pageKey="guide" initialContent={initialContent} />
}
