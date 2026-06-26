import { cn } from '@/utils/cn'

/** Larghezza contenuto pagine storefront — allineata a SectionContainer. */
export const SITE_CONTENT_CLASS = 'mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-12'

export function Container({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn(SITE_CONTENT_CLASS, className)}>{children}</div>
}
