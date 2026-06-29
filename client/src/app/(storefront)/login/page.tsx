import type { Metadata } from 'next'
import { LoginPage } from '@/views/LoginPage'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Accedi',
  noindex: true,
})

export default function Page() {
  return <LoginPage />
}
