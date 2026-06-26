import { MoreHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type DetailActionMenuItem = {
  label: string
  onSelect: () => void
  destructive?: boolean
}

type DetailPageActionBarProps = {
  primary?: React.ReactNode
  secondary?: React.ReactNode
  menu?: DetailActionMenuItem[]
  /** Barra fissa in fondo su viewport stretti (salva / torna). */
  stickyOnMobile?: boolean
  className?: string
}

/** CTA dettaglio: stack su mobile/tablet, inline da lg; opzionale sticky in basso. */
export function DetailPageActionBar({
  primary,
  secondary,
  menu,
  stickyOnMobile = false,
  className,
}: DetailPageActionBarProps) {
  const hasMenu = menu && menu.length > 0

  return (
    <div
      className={cn(
        'flex gap-2',
        stickyOnMobile
          ? cn(
              'detail-actions-sticky w-full flex-row flex-wrap items-stretch max-lg:[&_button]:w-full',
              'lg:w-auto lg:shrink-0 lg:flex-nowrap lg:items-center lg:justify-end lg:[&_button]:w-auto',
            )
          : cn(
              'w-full flex-col sm:flex-row sm:flex-wrap sm:justify-stretch lg:w-auto lg:justify-end lg:items-center',
            ),
        className,
      )}
    >
      {secondary ? (
        <div
          className={cn(
            'flex w-full flex-col gap-2 sm:flex-row',
            stickyOnMobile ? 'contents' : 'lg:w-auto',
          )}
        >
          {secondary}
        </div>
      ) : null}
      {primary ? (
        <div
          className={cn(
            'flex w-full flex-col gap-2 sm:flex-row',
            stickyOnMobile ? 'contents' : 'lg:w-auto',
          )}
        >
          {primary}
        </div>
      ) : null}
      {hasMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="icon" className="w-full lg:w-10" aria-label="Altre azioni">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            {menu.map((item) => (
              <DropdownMenuItem
                key={item.label}
                variant={item.destructive ? 'destructive' : 'default'}
                onClick={item.onSelect}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  )
}
