export { dynamic, fetchCache } from '@/app/_shared/private-route'

import { RequireAuth } from '@/app/RequireAuth'
import { AccountLayout } from '@/layouts/AccountLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AccountLayout>{children}</AccountLayout>
    </RequireAuth>
  )
}
