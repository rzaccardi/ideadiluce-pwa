import { Link, useLocation } from 'react-router-dom'
import { LogOutIcon, MenuIcon, UserIcon } from 'lucide-react'
import { useAdminAuth } from '@/context/admin-auth'
import { getBreadcrumbs, HomeIcon } from '@/lib/nav-config'
import { getInitials } from '@/lib/user-display'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type AppTopbarProps = {
  onMenuOpen: () => void
  onLogout: () => void
}

export function AppTopbar({ onMenuOpen, onLogout }: AppTopbarProps) {
  const { user } = useAdminAuth()
  const { pathname, search } = useLocation()
  const crumbs = getBreadcrumbs(pathname, search)
  const displayName = user?.displayName ?? user?.email ?? 'Utente'
  const initials = getInitials(displayName)

  return (
    <header className="safe-area-top sticky top-0 z-10 shrink-0 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm lg:static lg:shadow-none lg:bg-white lg:backdrop-blur-none">
      <div className="flex min-h-14 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 lg:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="touch-target shrink-0 lg:hidden"
          onClick={onMenuOpen}
          aria-label="Apri menu"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap items-center">
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="inline-flex items-center gap-1 text-xs text-gray-500"
                  render={<Link to="/orders" />}
                >
                  <HomeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              {crumbs.slice(1).map((crumb, i, tail) => {
                const isLast = i === tail.length - 1
                return (
                  <span key={`${crumb.label}-${i}`} className="contents">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0">
                      {isLast || !crumb.href ? (
                        <BreadcrumbPage className="truncate text-xs font-medium text-gray-900">
                          {crumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          className="truncate text-xs text-gray-500"
                          render={<Link to={crumb.href} />}
                        >
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-10 gap-2 px-2">
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-900 sm:inline">
                  {displayName}
                </span>
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-primary/80 text-xs text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <UserIcon data-icon="inline-start" />
                Profilo
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onLogout}>
                <LogOutIcon data-icon="inline-start" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
