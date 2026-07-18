import type { Metadata } from 'next'
import { ForgotPasswordPage } from '@/views/ForgotPasswordPage'

export const metadata: Metadata = {
  title: 'Password dimenticata',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ForgotPasswordPage />
}
