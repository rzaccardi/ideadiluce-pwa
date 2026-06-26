import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAdminAuth } from '@/context/admin-auth'
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock'
import { useIsLgUp } from '@/hooks/use-media'
import { AnimatedOutlet } from './animated-outlet'
import { AppSidebar } from './app-sidebar'
import { AppTopbar } from './app-topbar'

export function AppLayout() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()
  const isLg = useIsLgUp()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useBodyScrollLock(mobileNavOpen && !isLg)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <TooltipProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-gray-100">
        <AppSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col bg-gray-100">
          <AppTopbar
            onMenuOpen={() => setMobileNavOpen(true)}
            onLogout={() => void handleLogout()}
          />
          <main className="admin-main px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
            <div className="page-stack admin-page-canvas">
              <AnimatedOutlet />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
