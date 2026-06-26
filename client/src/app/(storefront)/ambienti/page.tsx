import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { AmbientiPage } from '@/views/AmbientiPage'

export const metadata: Metadata = buildMetadata({
  title: 'Scegli per ambiente | Idea di Luce',
  description:
    'Illuminazione per soggiorno, cucina, camera, bagno, studio ed esterno. Shop by room e shop the look.',
})

export default function Page() {
  return <AmbientiPage />
}
