import { SITE_PAGE_X_CLASS } from '@/components/site/primitives'
import { cn } from '@/utils/cn'

/** Larghezza contenuto pagine storefront — allineata a SectionContainer. */
export const SITE_CONTENT_CLASS = cn('mx-auto w-full max-w-[1320px]', SITE_PAGE_X_CLASS)

/** Container form auth (login, register, reset password, …). */
export const AUTH_FORM_CONTAINER_CLASS = cn('mx-auto w-full max-w-md', SITE_PAGE_X_CLASS)

export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn(SITE_CONTENT_CLASS, className)}>{children}</div>
}
