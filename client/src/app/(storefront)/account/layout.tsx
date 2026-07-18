export { dynamic, fetchCache } from '@/app/_shared/private-route'

import type { Metadata } from 'next'
import { RequireAuth } from '@/app/RequireAuth'
import { AccountLayout } from '@/layouts/AccountLayout'

export const metadata: Metadata = {
  title: 'Il mio account',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AccountLayout>{children}</AccountLayout>
    </RequireAuth>
  )
}
