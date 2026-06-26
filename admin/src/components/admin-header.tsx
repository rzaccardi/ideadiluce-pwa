import { Link, useLocation } from 'react-router-dom'
import { LogOutIcon, UserIcon } from 'lucide-react'
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
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

type AdminHeaderProps = {
  onLogout: () => void
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  const { user } = useAdminAuth()
  const { pathname, search } = useLocation()
  const crumbs = getBreadcrumbs(pathname, search)
  const displayName = user?.displayName ?? user?.email ?? 'Utente'
  const initials = getInitials(displayName)

  return (
    <header className="safe-area-top sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/95 px-3 backdrop-blur-sm sm:px-4 lg:static lg:bg-white lg:backdrop-blur-none">
      <SidebarTrigger className="touch-target -ml-1" />
      <Separator orientation="vertical" className="hidden h-4 md:block" />
      <Breadcrumb className="hidden min-w-0 flex-1 md:flex">
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
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
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
    </header>
  )
}
