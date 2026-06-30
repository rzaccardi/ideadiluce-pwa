import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchContentPageServer } from '@/lib/server-site-cache'
import { isEditorialPage } from '@/lib/site-page-keys'
import type { EditorialPageContent } from '@/types/site-content'
import { AmbientiPage } from '@/views/AmbientiPage'

export const metadata: Metadata = buildMetadata({
  title: 'Acquista per ambiente',
  description:
    'Illuminazione per soggiorno, cucina, camera, bagno, studio ed esterno. Scegli la luce giusta per ogni spazio.',
})

export default async function Page() {
  const locale = await getRequestLocale()
  const content = await fetchContentPageServer<EditorialPageContent>('ambienti', locale)
  const initialContent = content && isEditorialPage(content) ? content : null

  return <AmbientiPage initialContent={initialContent} />
}
