'use client'

import type { ReactNode } from 'react'
import { Link } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import type { SiteLink, SiteShellContent } from '@/types/site-content'
import { COMPANY_CONTACT } from '@/lib/company-contact'
import { isExternalHref } from '@/lib/href'
import { AcceptedPaymentMethods } from '@/components/payment-method-logos'
import { SocialBrandIcon, hasSocialBrandIcon } from '@/components/site/social-brand-icons'
import { cn } from '@/utils/cn'
import { BrandWordmark, SectionContainer } from './primitives'
import { FooterThemeSelect } from './FooterThemeSelect'

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 font-mono text-[10px] tracking-[0.14em] text-idl-glow uppercase">{children}</div>
  )
}

function FooterLinkList({ links, lp }: { links: SiteLink[]; lp: (href: string) => string }) {
  return (
    <ul className="space-y-2.5 text-[13.5px] text-idl-design-muted">
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`}>
          {isExternalHref(link.href) ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-idl-design-fg"
            >
              {link.label}
            </a>
          ) : (
            <Link to={lp(link.href)} className="hover:text-idl-design-fg">
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

function FooterSocial({ links }: { links: SiteLink[] }) {
  if (links.length === 0) return null

  const iconClassName =
    'text-idl-design-muted transition-colors group-hover:text-idl-design-fg group-focus-visible:text-idl-design-fg'

  return (
    <div>
      <FooterHeading>Seguici</FooterHeading>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          if (!hasSocialBrandIcon(link.label)) return null

          const className =
            'group flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-white/15 transition hover:border-idl-glow/40'

          if (!link.href) {
            return (
              <span key={link.label} className={cn(className, 'opacity-50')} aria-hidden>
                <SocialBrandIcon label={link.label} className={iconClassName} />
              </span>
            )
          }

          return (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              aria-label={link.label}
            >
              <SocialBrandIcon label={link.label} className={iconClassName} />
            </a>
          )
        })}
      </div>
    </div>
  )
}

export function SiteFooter({ footer }: { footer: SiteShellContent['footer'] }) {
  const lp = useLocalePath()
  const company = footer.company ?? {
    company: COMPANY_CONTACT.company,
    vat: COMPANY_CONTACT.vat,
    rea: COMPANY_CONTACT.rea,
    addressLines: [...COMPANY_CONTACT.addressLines],
    phone: COMPANY_CONTACT.phone,
    phoneHref: COMPANY_CONTACT.phoneHref,
    email: COMPANY_CONTACT.email,
    hoursLines: [...COMPANY_CONTACT.hoursLines],
  }

  const [ideaCol, serviceCol] = footer.columns

  return (
    <footer className="bg-idl-design text-idl-design-fg">
      <SectionContainer className="py-12">
        <Stagger
          className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.05fr_0.9fr_0.95fr_1.1fr]"
          stagger={0.08}
        >
          <StaggerItem>
            <Link to={lp('/')} className="mb-4 inline-block rounded-sm transition-opacity hover:opacity-80">
              <BrandWordmark className="text-white" accentClassName="text-idl-glow" />
            </Link>
            <FooterHeading>Info aziendali</FooterHeading>
            <div className="space-y-1 text-[13px] leading-relaxed text-idl-design-muted">
              <p>{company.company}</p>
              <p>P.IVA / VAT: {company.vat}</p>
              <p>REA: {company.rea}</p>
            </div>
            <div className="mt-5">
              <FooterHeading>Indirizzo</FooterHeading>
              <div className="text-[13px] leading-relaxed text-idl-design-muted">
                {company.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </StaggerItem>

          {ideaCol ? (
            <StaggerItem key={ideaCol.title}>
              <FooterHeading>{ideaCol.title}</FooterHeading>
              <FooterLinkList links={ideaCol.links} lp={lp} />
            </StaggerItem>
          ) : null}

          <StaggerItem>
            <FooterHeading>Servizio clienti</FooterHeading>
            <div className="space-y-1 text-[13px] leading-relaxed text-idl-design-muted">
              <p>
                <a href={company.phoneHref} className="hover:text-idl-design-fg">
                  Tel: {company.phone}
                </a>
              </p>
              <p>
                Email:{' '}
                <a href={`mailto:${company.email}`} className="text-idl-glow hover:text-idl-design-fg">
                  {company.email}
                </a>
              </p>
            </div>
            <div className="mt-5">
              <FooterHeading>Orari</FooterHeading>
              <div className="text-[13px] leading-relaxed text-idl-design-muted">
                {company.hoursLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
            {serviceCol && serviceCol.links.length > 0 ? (
              <div className="mt-5">
                <FooterLinkList links={serviceCol.links} lp={lp} />
              </div>
            ) : null}
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-col gap-5">
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
              {(footer.social?.length ?? 0) > 0 ? <FooterSocial links={footer.social ?? []} /> : null}
            </div>
          </StaggerItem>
        </Stagger>
      </SectionContainer>
      <Reveal delay={0.06} className="border-t border-white/10">
        <SectionContainer className="py-5">
          <AcceptedPaymentMethods variant="dark" />
        </SectionContainer>
      </Reveal>
      <Reveal delay={0.08} className="border-t border-white/10">
        <SectionContainer className="flex flex-col gap-4 py-5 text-[12px] text-idl-design-subtle sm:flex-row sm:items-center sm:justify-between">
          <Link to={lp('/')} className="rounded-sm transition-opacity hover:opacity-80">
            <BrandWordmark className="text-white" accentClassName="text-idl-glow" />
          </Link>
          <div className="flex w-full flex-col items-end gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:gap-5">
            <span className="max-w-prose text-right sm:text-left">{footer.legalNote}</span>
            <FooterThemeSelect />
          </div>
        </SectionContainer>
      </Reveal>
    </footer>
  )
}
