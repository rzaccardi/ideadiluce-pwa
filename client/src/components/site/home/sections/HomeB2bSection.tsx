import type { HomePageContent } from '@/types/site-content'
import { Link } from '@/lib/navigation'
import { SectionContainer, Eyebrow } from '../../primitives'
import { Reveal } from '@/components/motion'
import type { LocalePathFn } from '../../sections/types'

type Props = {
  b2b: HomePageContent['b2b']
  leadGen: HomePageContent['leadGen']
  lp: LocalePathFn
}

export function HomeB2bSection({ b2b, leadGen, lp }: Props) {
  return (
    <Reveal className="bg-idl-design-elevated text-idl-design-fg">
      <SectionContainer className="grid gap-8 py-12 lg:grid-cols-2">
        <div>
          <Eyebrow>{b2b.eyebrow}</Eyebrow>
          <h2 className="mt-3 font-serif text-2xl">{b2b.title}</h2>
          <p className="mt-3 text-idl-design-muted">{b2b.description}</p>
          <ul className="mt-4 space-y-2 text-sm text-idl-design-subtle">
            {b2b.bullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
          <Link to={lp(b2b.ctaHref)} className="mt-5 inline-block font-bold text-idl-glow">
            {b2b.ctaLabel}
          </Link>
        </div>
        <div className="rounded-lg border border-idl-glow/20 bg-idl-design p-6">
          <h3 className="font-serif text-xl">{leadGen.title}</h3>
          <p className="mt-2 text-sm text-idl-design-muted">{leadGen.description}</p>
          <Link
            to={lp(leadGen.ctaHref)}
            className="mt-4 inline-block rounded-md bg-idl-glow px-4 py-2.5 text-sm font-bold text-idl-design"
          >
            {leadGen.ctaLabel}
          </Link>
        </div>
      </SectionContainer>
    </Reveal>
  )
}
