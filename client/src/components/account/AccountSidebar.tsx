import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100',
  )

export function AccountSidebar() {
  return (
    <aside className="space-y-1 rounded-xl border border-zinc-200 bg-white p-3">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Area personale
      </p>
      <NavLink to="/account" end className={linkClass}>
        Profilo
      </NavLink>
      <NavLink to="/account/orders" className={linkClass}>
        Ordini
      </NavLink>
    </aside>
  )
}
