import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { ATTACCO_SOCKETS } from '@/lib/attacco.defaults'
import { AttaccoSocketIcon } from '../AttaccoIcons'
import type { LocalePathFn } from '../../sections/types'
import { cn } from '@/utils/cn'

type Props = {
  lp: LocalePathFn
}

export function AttaccoSocketGridSection({ lp }: Props) {
  return (
    <section className="bg-white">
      <SectionContainer className="py-10 sm:py-12">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[22px] font-extrabold tracking-tight text-idl-graphite sm:text-2xl">Trova per attacco</h2>
          <span className="text-[13px] text-idl-muted">Ordinati per diffusione</span>
        </div>
        <p className="mb-6 text-[14px] text-idl-graphite-2">
          Riconosci l&apos;attacco dall&apos;illustrazione e vai dritto ai prodotti compatibili.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ATTACCO_SOCKETS.map((socket) => (
            <Link
              key={socket.code}
              to={lp(socket.href)}
              className={cn(
                'flex flex-col rounded-[10px] border p-5 transition hover:border-idl-amber hover:shadow-[0_8px_22px_rgba(0,0,0,0.05)]',
                socket.dashed
                  ? 'border-dashed border-idl-tech-border bg-idl-tech-panel'
                  : 'border-idl-tech-border bg-white',
              )}
            >
              <div className="mb-3.5 flex items-center gap-4">
                <div
                  className={cn(
                    'flex size-[60px] shrink-0 items-center justify-center rounded-lg',
                    socket.dashed ? 'border border-idl-tech-border bg-white' : 'bg-idl-path-tech',
                  )}
                >
                  <AttaccoSocketIcon icon={socket.icon} size={socket.dashed ? 34 : 40} />
                </div>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'font-mono text-[17px] font-medium text-idl-graphite sm:text-[19px]',
                      socket.key === 'GU5.3' && 'text-[17px]',
                    )}
                  >
                    {socket.code}
                  </div>
                  <div className="text-[12px] text-idl-muted">{socket.hint}</div>
                </div>
              </div>
              <p className="flex-1 text-[13px] leading-snug text-idl-graphite-2">{socket.description}</p>
              <div
                className={cn(
                  'mt-3.5 text-[13px] font-bold',
                  socket.dashed ? 'text-idl-graphite-2' : 'text-idl-amber',
                )}
              >
                {socket.dashed ? 'Tutti gli attacchi →' : `Vedi prodotti ${socket.code.split(' ')[0]} →`}
              </div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
