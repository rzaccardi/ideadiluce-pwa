import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { ATTACCO_SHAPES } from '@/lib/attacco.defaults'
import { AttaccoShapeIcon } from '../AttaccoIcons'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  lp: LocalePathFn
}

export function AttaccoShapeGridSection({ lp }: Props) {
  return (
    <section className="border-t border-idl-tech-border bg-white">
      <SectionContainer className="py-10 sm:py-12">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[22px] font-extrabold tracking-tight text-idl-graphite sm:text-2xl">
            Scegli per forma della lampadina
          </h2>
          <span className="text-[13px] text-idl-muted">Riconosci la sagoma del vetro</span>
        </div>
        <p className="mb-6 text-[14px] text-idl-graphite-2">
          Hai già l&apos;attacco giusto? Affina la scelta per forma: estetica, ingombro e fascio di luce cambiano.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ATTACCO_SHAPES.map((shape) => (
            <Link
              key={shape.label}
              to={lp(shape.href)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-[10px] border px-3 py-4 transition hover:border-idl-amber hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)]',
                shape.dashed
                  ? 'justify-center border-dashed border-idl-tech-border bg-idl-tech-panel'
                  : 'border-idl-tech-border bg-white',
              )}
            >
              <div className="flex h-[74px] w-full items-center justify-center">
                <AttaccoShapeIcon icon={shape.icon} />
              </div>
              <div className="text-center">
                <div className="text-[14px] font-bold text-idl-graphite sm:text-[14.5px]">{shape.label}</div>
                <div className="mt-0.5 font-mono text-[11px] text-idl-muted">{shape.code}</div>
              </div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
