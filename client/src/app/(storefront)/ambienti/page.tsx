import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { AmbientiPage } from '@/views/AmbientiPage'

export const metadata: Metadata = buildMetadata({
  title: 'Acquista per ambiente',
  description:
    'Illuminazione per soggiorno, cucina, camera, bagno, studio ed esterno. Scegli la luce giusta per ogni spazio.',
})

export default function Page() {
  return <AmbientiPage />
}
