import { Link } from '@/lib/navigation'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import type { LocalePathFn } from './types'

export type SocketTileItem = {
  code: string
  hint?: string
  title?: string
  description?: string
  href: string
}

type Props = {
  items: ReadonlyArray<SocketTileItem>
  lp: LocalePathFn
  variant?: 'home' | 'editorial'
  stagger?: number
}

export function SocketTileGrid({ items, lp, variant = 'home', stagger = 0.04 }: Props) {
  if (variant === 'editorial') {
    return (
      <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" stagger={stagger}>
        {items.map((tile) => (
          <StaggerItem key={tile.href}>
            <HoverLift>
              <Link
                to={lp(tile.href)}
                className="flex min-h-[120px] flex-col rounded-lg border border-idl-tech-border bg-idl-tech-panel p-5 transition hover:border-idl-brass"
              >
                <div className="font-mono text-2xl font-bold tracking-tight text-idl-ink">
                  {tile.code ?? tile.title}
                </div>
                {tile.description ? (
                  <p className="mt-2 text-sm text-idl-muted">{tile.description}</p>
                ) : null}
                <span className="mt-auto pt-4 text-xs font-bold text-idl-brass">Vedi prodotti →</span>
              </Link>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>
    )
  }

  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8" stagger={stagger}>
      {items.map((tile) => (
        <StaggerItem key={tile.code}>
          <HoverLift>
            <Link
              to={lp(tile.href)}
              className="block rounded-lg border border-idl-tech-border px-2 py-4 text-center transition hover:border-idl-amber hover:bg-idl-tech-panel"
            >
              <div className="font-mono text-lg font-medium">{tile.code}</div>
              {tile.hint ? <div className="mt-1.5 text-[11px] text-idl-muted">{tile.hint}</div> : null}
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
