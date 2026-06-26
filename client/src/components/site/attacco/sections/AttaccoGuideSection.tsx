import { Link } from '@/lib/navigation'
import { SectionContainer } from '../../primitives'
import { ATTACCO_GUIDE_CARDS } from '@/lib/attacco.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  lp: LocalePathFn
}

export function AttaccoGuideSection({ lp }: Props) {
  return (
    <section className="border-t border-idl-tech-border bg-idl-path-tech">
      <SectionContainer className="py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-tight text-idl-graphite sm:text-2xl">
              Come riconoscere l&apos;attacco
            </h2>
            <p className="mt-1 text-[14px] text-idl-graphite-2">
              Le confusioni più comuni, chiarite in un colpo d&apos;occhio.
            </p>
          </div>
          <Link to={lp('/guide')} className="shrink-0 text-[14px] font-bold text-idl-amber">
            Guida completa agli attacchi →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ATTACCO_GUIDE_CARDS.map((card) => (
            <div key={card.title} className="rounded-[10px] border border-idl-tech-border bg-white p-5 sm:p-6">
              <h3 className="text-base font-bold text-idl-graphite">{card.title}</h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-idl-graphite-2">{card.body}</p>
            </div>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
