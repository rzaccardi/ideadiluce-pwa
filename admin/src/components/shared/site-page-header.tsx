import { cn } from '@/lib/utils'

type SitePageHeaderProps = {
  title: string
  description?: string
  className?: string
}

/** Titolo pagina contestuale (es. dettaglio entità) con bordo inferiore. */
export function SitePageHeader({ title, description, className }: SitePageHeaderProps) {
  return (
    <div className={cn('min-w-0 flex-1 border-b border-gray-200 pb-3 sm:pb-4', className)}>
      <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
      ) : null}
    </div>
  )
}
