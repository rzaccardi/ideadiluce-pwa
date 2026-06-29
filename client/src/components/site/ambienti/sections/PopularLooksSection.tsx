import { Link } from '@/lib/navigation'
import { SiteImage } from '../../SiteImage'
import { SectionContainer } from '../../primitives'
import { AMBIENTI_POPULAR_LOOKS } from '@/lib/ambienti.defaults'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  lp: LocalePathFn
}

export function PopularLooksSection({ lp }: Props) {
  return (
    <section className="border-t border-idl-path-design-border bg-idl-cream">
      <SectionContainer className="py-10 sm:py-14">
        <h2 className="font-serif text-[26px] font-medium text-idl-ink sm:text-[30px]">I look più cercati</h2>
        <p className="mt-1.5 mb-6 text-[14.5px] text-idl-ink-muted">
          Scene reali, già pronte: ogni look include i prodotti visibili e i componenti necessari.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AMBIENTI_POPULAR_LOOKS.map((look) => (
            <Link
              key={look.title}
              to={lp(look.href)}
              className="group overflow-hidden rounded-xl border border-idl-path-design-border bg-idl-tech-panel transition hover:border-idl-brass hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-idl-cream">
                <SiteImage
                  src={look.imageUrl}
                  alt={look.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-4 sm:p-[18px]">
                <h3 className="font-serif text-[17px] font-medium text-idl-ink sm:text-[18px]">{look.title}</h3>
                <p className="mt-1 text-[12px] text-idl-ink-muted">{look.subtitle}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12px] text-idl-graphite-2">
                    {look.productCount} prodotti · da <strong className="text-idl-ink">{look.fromPrice}</strong>
                  </span>
                  <span className="text-[12.5px] font-bold text-idl-brass">Shop →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
