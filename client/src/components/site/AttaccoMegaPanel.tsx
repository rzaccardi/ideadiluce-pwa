'use client'

import { motion, useReducedMotion } from '@/lib/motion-client'
import { Link } from '@/lib/navigation'
import { AttaccoSocketIcon } from '@/components/site/attacco/AttaccoIcons'
import { ATTACCO_SOCKETS } from '@/lib/attacco.defaults'
import { useLocalePath } from '@/hooks/use-locale-path'
import { SectionContainer } from './primitives'
import { slideDownVariants, transitionBase } from '@/lib/motion/presets'

const MEGA_SOCKETS = ATTACCO_SOCKETS.filter((socket) => !socket.dashed).slice(0, 5)
const ALL_SOCKETS = ATTACCO_SOCKETS.find((socket) => socket.dashed)!

export function AttaccoMegaPanel({ onLinkClick }: { onLinkClick?: () => void } = {}) {
  const lp = useLocalePath()
  const reduceMotion = useReducedMotion()

  const inner = (
    <SectionContainer className="py-8">
      <div className="mb-4 font-mono text-[10px] tracking-[0.14em] text-idl-amber uppercase">
        Lampadine per attacco · ordinati per diffusione
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
              <div className="text-[11px] text-idl-muted">{socket.hint}</div>
            </div>
          </Link>
        ))}
        <Link
          to={lp(ALL_SOCKETS.href)}
          onClick={onLinkClick}
          className="flex items-center justify-center rounded-lg border border-dashed border-idl-tech-border bg-idl-tech-panel p-3.5 text-center transition hover:border-idl-amber"
        >
          <span className="text-[13px] font-bold text-idl-graphite-2">Tutti gli attacchi →</span>
        </Link>
      </div>
    </SectionContainer>
  )

  const panelClass =
    'absolute inset-x-0 top-full border-t border-idl-tech-border bg-white shadow-2xl'

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
