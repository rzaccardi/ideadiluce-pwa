import { Outlet } from 'react-router-dom'
import { AccountSidebar } from '@/components/account/AccountSidebar'

export function AccountLayout() {
  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <AccountSidebar />
      <div>
        <Outlet />
      </div>
    </div>
  )
}
