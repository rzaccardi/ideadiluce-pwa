import { cn } from '@/lib/utils'

type BrandLogoProps = {
  className?: string
  compact?: boolean
  /** Su sfondo scuro (login) */
  inverted?: boolean
}

export function BrandLogo({ className, compact, inverted }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          inverted
            ? 'bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground',
        )}
      >
        IL
      </div>
      {!compact ? (
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate text-sm font-semibold tracking-tight',
              inverted && 'text-primary-foreground',
            )}
          >
            Idea di Luce
          </span>
          <span
            className={cn(
              'text-xs text-muted-foreground',
              inverted && 'text-primary-foreground/70',
            )}
          >
            Backoffice
          </span>
        </div>
      ) : null}
    </div>
  )
}
