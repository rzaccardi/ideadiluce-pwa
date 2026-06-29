import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { AttaccoPage } from '@/views/AttaccoPage'

export const metadata: Metadata = buildMetadata({
  title: 'Scegli per attacco',
  description: 'Trova lampadine e ricambi per attacco: E27, GU10, R7s, G9 e altri.',
})

export default function Page() {
  return <AttaccoPage />
}
