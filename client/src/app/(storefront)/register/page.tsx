import type { Metadata } from 'next'
import { RegisterPage } from '@/views/RegisterPage'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Registrati',
  noindex: true,
})

export default function Page() {
  return <RegisterPage />
}
