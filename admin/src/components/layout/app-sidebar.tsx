import { Link, useLocation } from 'react-router-dom'
import { XIcon } from 'lucide-react'
import { navSections } from '@/lib/nav-config'
import { BrandLogo } from '@/components/brand-logo'
import { cn } from '@/lib/utils'

type AppSidebarProps = {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation()

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity lg:hidden"
          aria-label="Chiudi menu"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        className={cn(
          'safe-area-top fixed inset-y-0 left-0 z-50 flex h-full w-[min(18rem,88vw)] flex-col border-r border-gray-200 bg-gradient-to-b from-gray-50 to-white transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-auto lg:w-72 lg:shrink-0 lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        )}
        aria-label="Navigazione principale"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
          <Link to="/orders" className="min-w-0" onClick={onMobileClose}>
            <BrandLogo />
          </Link>
          <button
            type="button"
            className="touch-target rounded-md text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={onMobileClose}
            aria-label="Chiudi menu"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div
              key={section.label}
              className={cn(sectionIndex > 0 && 'mt-5 border-t border-gray-100 pt-5')}
            >
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const isActive = item.match
                    ? item.match(location.pathname)
                    : location.pathname.startsWith(item.to)
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onMobileClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            isActive ? 'bg-white/15 text-white' : item.accentBgClass,
                          )}
                        >
                          <Icon
                            className={cn('h-4 w-4', isActive ? 'text-white' : item.accentClass)}
                            aria-hidden
                          />
                        </span>
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <p className="px-2 text-[11px] text-gray-500">Idea di Luce · Backoffice</p>
        </div>
      </aside>
    </>
  )
}
