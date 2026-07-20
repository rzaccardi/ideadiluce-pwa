import { Link } from '@/lib/navigation'
import { HoverLift, Stagger, StaggerItem } from '@/components/motion'
import { SiteHeading } from '@/components/site/SiteHeading'
import { AttaccoSocketIcon } from '@/components/site/attacco/AttaccoIcons'
import type { AttaccoSocketKey } from '@/lib/attacco.defaults'
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

const SOCKET_ICON_ALIASES: Record<string, AttaccoSocketKey> = {
  T8: 'G13',
  'GU5-3': 'GU5.3',
}

function resolveSocketIcon(code: string): AttaccoSocketKey | 'altri' {
  const normalized = code.trim()
  const alias = SOCKET_ICON_ALIASES[normalized]
  if (alias) return alias
  const known = new Set<string>([
    'E27',
    'E14',
    'GU10',
    'GU5.3',
    'G9',
    'G4',
    'R7s',
    'GX53',
    'G13',
    '2G11',
    'G24',
  ])
  return known.has(normalized) ? (normalized as AttaccoSocketKey) : 'altri'
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
                <SiteHeading level={3} className="font-mono text-2xl font-bold tracking-tight text-idl-ink">
                  {tile.code ?? tile.title}
                </SiteHeading>
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
              className="flex flex-col items-center rounded-lg border border-idl-tech-border bg-white px-2 py-4 text-center transition hover:border-idl-amber hover:bg-idl-cream dark:bg-idl-tech-panel dark:hover:bg-idl-tech-panel"
            >
              <AttaccoSocketIcon icon={resolveSocketIcon(tile.code)} size={36} className="mb-2" />
              <div className="font-mono text-lg font-medium">{tile.code}</div>
              {tile.hint ? <div className="mt-1.5 text-[11px] text-idl-muted">{tile.hint}</div> : null}
            </Link>
          </HoverLift>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
