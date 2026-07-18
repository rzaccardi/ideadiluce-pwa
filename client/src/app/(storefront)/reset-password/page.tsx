import type { Metadata } from 'next'
import { ResetPasswordPage } from '@/views/ResetPasswordPage'

export const metadata: Metadata = {
  title: 'Reimposta password',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ResetPasswordPage />
}
