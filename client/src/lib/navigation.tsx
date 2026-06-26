'use client'

import NextLink from 'next/link'
import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams, useParams as useNextParams } from 'next/navigation'
import { cn } from '@/utils/cn'

type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & {
  href?: React.ComponentProps<typeof NextLink>['href']
  to?: string
}

export function Link({ className, href, to, ...props }: LinkProps) {
  const resolvedHref = href ?? to ?? '/'
  return <NextLink href={resolvedHref} className={className} {...props} />
}

type NavLinkProps = Omit<LinkProps, 'className'> & {
  activeClassName?: string
  inactiveClassName?: string
  end?: boolean
  className?: string | ((args: { isActive: boolean }) => string)
}

export function NavLink({
  href,
  to,
  className,
  activeClassName,
  inactiveClassName,
  end = false,
  ...props
}: NavLinkProps) {
  const pathname = usePathname()
  const resolvedHref = typeof (href ?? to) === 'string' ? (href ?? to)! : '/'
  const isActive = end
    ? pathname === resolvedHref
    : pathname === resolvedHref ||
      (resolvedHref !== '/' && pathname.startsWith(`${resolvedHref}/`))

  const resolvedClassName =
    typeof className === 'function'
      ? className({ isActive })
      : cn(isActive ? activeClassName : inactiveClassName, className)

  return <NextLink href={href ?? to ?? '/'} className={resolvedClassName} {...props} />
}

export { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation'

export function useParam(name: string): string {
  const params = useNextParams()
  const value = params[name]
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

export function useNavigate() {
  const router = useRouter()
  return (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) router.replace(path)
    else router.push(path)
  }
}

export function useLocation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  return {
    pathname,
    search: search ? `?${search}` : '',
    hash: '',
    state: null as { from?: string } | null,
  }
}

export function useQueryParams() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const setParams = (next: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
    const resolved =
      typeof next === 'function'
        ? next(new URLSearchParams(searchParams.toString()))
        : next
    const q = resolved.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  return [searchParams, setParams] as const
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (replace) router.replace(to)
    else router.push(to)
  }, [router, to, replace])
  return null
}
