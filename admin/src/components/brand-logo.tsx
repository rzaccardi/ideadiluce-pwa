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
      <img
        src="/brand/icon-512.png"
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover"
        draggable={false}
        aria-hidden
      />
      {!compact ? (
        <div className="flex min-w-0 flex-col">
          <img
            src={inverted ? '/brand/ideadiluce-white.svg' : '/brand/ideadiluce.svg'}
            alt="Idea di Luce"
            width={140}
            height={24}
            className="h-5 w-auto"
            draggable={false}
          />
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
