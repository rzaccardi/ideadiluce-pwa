import { StorefrontLayout } from '@/layouts/StorefrontLayout'
import { getRequestLocale } from '@/lib/locale-server'
import { fetchShellContentServer } from '@/lib/server-site'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()
  const initialShell = await fetchShellContentServer(locale)

  return <StorefrontLayout initialShell={initialShell}>{children}</StorefrontLayout>
}
