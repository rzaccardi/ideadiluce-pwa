'use client'

import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import type { SiteShellContent } from '@/types/site-content'
import { BrandWordmark, SectionContainer } from './primitives'

export function SiteFooter({ footer }: { footer: SiteShellContent['footer'] }) {
  const lp = useLocalePath()

  return (
    <footer className="bg-idl-design text-idl-design-fg">
      <SectionContainer className="py-12">
        <Stagger className="grid gap-10 lg:grid-cols-[repeat(3,minmax(0,1fr))_1.1fr]" stagger={0.08}>
          {footer.columns.map((col) => (
            <StaggerItem key={col.title}>
              <div className="mb-4 font-mono text-[10px] tracking-[0.14em] text-idl-glow uppercase">{col.title}</div>
              <ul className="space-y-2.5 text-[13.5px] text-idl-design-muted">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link to={lp(link.href)} className="hover:text-idl-design-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </StaggerItem>
          ))}
          <StaggerItem>
            <div className="rounded-[10px] border border-idl-glow/20 bg-idl-design-elevated p-5">
              <div className="font-serif text-lg">{footer.notFoundCta.title}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-idl-design-subtle">
                {footer.notFoundCta.description}
              </p>
              <Link
                to={lp(footer.notFoundCta.ctaHref)}
                className="mt-4 inline-block rounded-md bg-idl-glow px-4 py-2.5 text-[13px] font-bold text-idl-design"
              >
                {footer.notFoundCta.ctaLabel}
              </Link>
            </div>
          </StaggerItem>
        </Stagger>
      </SectionContainer>
      <Reveal delay={0.08} className="border-t border-white/10">
        <SectionContainer className="flex flex-col gap-3 py-5 text-[12px] text-idl-design-subtle sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark className="text-idl-design-fg" />
          <span>{footer.legalNote}</span>
        </SectionContainer>
      </Reveal>
    </footer>
  )
}
