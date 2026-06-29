'use client'

import { useMemo } from 'react'
import { useSnapshot } from 'valtio/react'
import { motion, useReducedMotion } from '@/lib/motion-client'
import { Link } from '@/lib/navigation'
import { AttaccoSocketIcon } from '@/components/site/attacco/AttaccoIcons'
import { ATTACCO_SOCKETS } from '@/lib/attacco.defaults'
import { siteStore } from '@/features/site'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { SiteMegaMenuPanel, SiteShellContent } from '@/types/site-content'
import { SectionContainer } from './primitives'
import { slideDownVariants, transitionBase } from '@/lib/motion/presets'

const MEGA_SOCKETS = ATTACCO_SOCKETS.filter((socket) => !socket.dashed).slice(0, 5)

const DEFAULT_ATTACCO_PANEL: Pick<SiteMegaMenuPanel, 'eyebrow' | 'allSocketsCta' | 'promo'> = {
  eyebrow: 'Lampadine per attacco · ordinati per diffusione',
  allSocketsCta: 'Tutti gli attacchi →',
  promo: {
    title: "Non trovi l'attacco?",
    description: 'Invia una foto o il codice prodotto: ti aiutiamo a trovare il ricambio.',
    ctaLabel: 'Richiedi supporto →',
    ctaHref: '/prodotto-non-trovato',
    variant: 'technical',
  },
}

function resolveAttaccoPanel(shell: SiteShellContent | undefined): SiteMegaMenuPanel {
  const item = shell?.nav.items.find(
    (navItem): navItem is Extract<(typeof shell.nav.items)[number], { kind: 'dropdown' }> =>
      navItem.kind === 'dropdown' && navItem.id === 'attacco',
  )
  return {
    columns: [],
    ...DEFAULT_ATTACCO_PANEL,
    ...item?.panel,
  }
}

function hintFromPanel(panel: SiteMegaMenuPanel, socket: (typeof MEGA_SOCKETS)[number]) {
  for (const column of panel.columns) {
    for (const link of column.links) {
      if (link.href !== socket.href) continue
      const parts = link.label.split(' — ')
      if (parts.length > 1) return parts.slice(1).join(' — ')
    }
  }
  return socket.hint
}

export function AttaccoMegaPanel({ onLinkClick }: { onLinkClick?: () => void } = {}) {
  const lp = useLocalePath()
  const reduceMotion = useReducedMotion()
  const { pages } = useSnapshot(siteStore)
  const panel = useMemo(() => resolveAttaccoPanel(pages.shell as SiteShellContent | undefined), [pages.shell])

  const inner = (
    <SectionContainer className="py-8">
      <div className="mb-4 font-mono text-[10px] tracking-[0.14em] text-idl-amber uppercase">
        {panel.eyebrow ?? DEFAULT_ATTACCO_PANEL.eyebrow}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {MEGA_SOCKETS.map((socket) => (
          <Link
            key={socket.key}
            to={lp(socket.href)}
            onClick={onLinkClick}
            className="flex items-center gap-3 rounded-lg border border-idl-tech-border p-3.5 transition hover:border-idl-amber"
          >
            <AttaccoSocketIcon icon={socket.icon} size={28} />
            <div className="min-w-0">
              <div className="font-mono text-sm font-semibold text-idl-graphite">{socket.code}</div>
              <div className="text-[11px] text-idl-muted">{hintFromPanel(panel, socket)}</div>
            </div>
          </Link>
        ))}
        <Link
          to={lp('/attacco')}
          onClick={onLinkClick}
          className="flex items-center justify-center rounded-lg border border-dashed border-idl-tech-border bg-idl-tech-panel p-3.5 text-center transition hover:border-idl-amber"
        >
          <span className="text-[13px] font-bold text-idl-graphite-2">
            {panel.allSocketsCta ?? DEFAULT_ATTACCO_PANEL.allSocketsCta}
          </span>
        </Link>
      </div>
      {panel.promo ? (
        <div className="mt-8 rounded-[10px] border border-idl-promo-border bg-idl-promo-bg p-5 lg:max-w-sm">
          <div className="mb-2 text-base font-bold text-idl-graphite">{panel.promo.title}</div>
          <p className="mb-4 text-[12.5px] leading-relaxed text-idl-promo-text">{panel.promo.description}</p>
          <Link
            to={lp(panel.promo.ctaHref)}
            onClick={onLinkClick}
            className="inline-block rounded-md bg-idl-amber px-4 py-2.5 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-[#b08e3e]"
          >
            {panel.promo.ctaLabel}
          </Link>
        </div>
      ) : null}
    </SectionContainer>
  )

  const panelClass =
    'absolute inset-x-0 top-full border-t border-idl-tech-border bg-idl-tech-panel shadow-2xl'

  if (reduceMotion) {
    return <div className={panelClass}>{inner}</div>
  }

  return (
    <motion.div
      className={panelClass}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={slideDownVariants}
      transition={transitionBase}
    >
      {inner}
    </motion.div>
  )
}
