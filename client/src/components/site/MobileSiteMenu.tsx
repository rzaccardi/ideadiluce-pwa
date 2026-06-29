'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { Link } from '@/lib/navigation'
import { AttaccoSocketIcon } from '@/components/site/attacco/AttaccoIcons'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { HeaderThemeToggle } from '@/components/site/HeaderThemeToggle'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { SiteImage } from '@/components/site/SiteImage'
import { siteStore } from '@/features/site'
import { ATTACCO_SOCKETS } from '@/lib/attacco.defaults'
import { resolveNavDropdownHref } from '@/lib/dc-static-routes'
import {
  FALLBACK_ROOM_ITEMS,
  isVisualColumn,
  resolveNavLinkVisual,
  resolveStyleLookVisual,
  shortMobileTabLabel,
} from '@/lib/mobile-nav-visuals'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { HomePageContent, SiteMegaMenuPanel, SiteShellContent } from '@/types/site-content'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { BrandWordmark, SITE_PAGE_X_CLASS } from './primitives'

const MEGA_SOCKETS = ATTACCO_SOCKETS.filter((socket) => !socket.dashed).slice(0, 5)

type NavItem = SiteShellContent['nav']['items'][number]

type Props = {
  nav: SiteShellContent['nav']
  activeNavId?: string | null
  onClose: () => void
}

function MobileMenuCloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function MobilePromoCard({
  promo,
  onNavigate,
}: {
  promo: NonNullable<SiteMegaMenuPanel['promo']>
  onNavigate: () => void
}) {
  const lp = useLocalePath()
  const design = promo.variant === 'design'

  return (
    <div
      className={cn(
        'mt-5 rounded-xl border p-4',
        design ? 'border-idl-glow/25 bg-idl-design text-idl-design-fg' : 'border-idl-promo-border bg-idl-promo-bg',
      )}
    >
      <div className={cn('text-[15px] font-bold', design ? 'font-serif text-idl-design-fg' : 'text-idl-graphite')}>
        {promo.title}
      </div>
      <p
        className={cn(
          'mt-1.5 text-[13px] leading-relaxed',
          design ? 'text-idl-design-subtle' : 'text-idl-promo-text',
        )}
      >
        {promo.description}
      </p>
      <Link
        to={lp(promo.ctaHref)}
        onClick={onNavigate}
        className={cn(
          'mt-3 inline-block rounded-md px-4 py-2.5 text-[13px] font-bold transition-colors',
          design
            ? 'bg-idl-glow text-idl-design hover:bg-idl-cta-glow-hover'
            : 'bg-idl-amber text-white hover:bg-idl-cta-amber-hover',
        )}
      >
        {promo.ctaLabel}
      </Link>
    </div>
  )
}

function MobileVisualLink({
  href,
  label,
  visual,
  subtitle,
  onNavigate,
  aspect = '4/3',
}: {
  href: string
  label: string
  visual?: { imageUrl: string; videoUrl?: string } | null
  subtitle?: string
  onNavigate: () => void
  aspect?: '4/3' | '1/1' | '3/4'
}) {
  const lp = useLocalePath()
  const aspectClass =
    aspect === '1/1' ? 'aspect-square' : aspect === '3/4' ? 'aspect-[3/4]' : 'aspect-[4/3]'

  return (
    <Link
      to={lp(href)}
      onClick={onNavigate}
      className="group block overflow-hidden rounded-xl border border-idl-border bg-white transition hover:border-idl-brass"
    >
      {visual ? (
        <div className={cn('relative overflow-hidden bg-idl-cream', aspectClass)}>
          <SiteImage
            src={visual.imageUrl}
            alt=""
            fill
            sizes="45vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center bg-idl-cream px-3',
            aspectClass,
            'text-[12px] font-semibold text-idl-muted',
          )}
        >
          {label}
        </div>
      )}
      <div className="p-2.5">
        <div className="text-[13.5px] font-semibold leading-snug text-idl-ink">{label}</div>
        {subtitle ? <div className="mt-0.5 text-[11px] text-idl-muted">{subtitle}</div> : null}
      </div>
    </Link>
  )
}

function MobileColumnSubTabs({
  columns,
  activeIndex,
  onChange,
  tone,
}: {
  columns: SiteMegaMenuPanel['columns']
  activeIndex: number
  onChange: (index: number) => void
  tone: 'design' | 'technical'
}) {
  if (columns.length <= 1) return null

  return (
    <div
      role="tablist"
      aria-label="Sezioni"
      className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
    >
      {columns.map((column, index) => {
        const selected = index === activeIndex
        return (
          <button
            key={column.title}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(index)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.1em] uppercase transition',
              selected
                ? tone === 'design'
                  ? 'bg-idl-design text-idl-glow'
                  : 'bg-idl-amber/15 text-idl-amber'
                : 'border border-idl-border text-idl-muted hover:text-idl-ink',
            )}
          >
            {column.title}
          </button>
        )
      })}
    </div>
  )
}

function MobileMegaColumnContent({
  column,
  tone,
  onNavigate,
}: {
  column: SiteMegaMenuPanel['columns'][number]
  tone: 'design' | 'technical'
  onNavigate: () => void
}) {
  const lp = useLocalePath()
  const visualGrid = isVisualColumn(column.title)

  if (visualGrid) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {column.links.map((link, index) => {
          const visual =
            /stile/i.test(column.title)
              ? resolveStyleLookVisual(index)
              : resolveNavLinkVisual(link.href, link.label)
          const subtitle =
            link.label.includes(' — ') ? link.label.split(' — ').slice(1).join(' — ') : undefined
          const title = link.label.split(' — ')[0] ?? link.label

          return (
            <MobileVisualLink
              key={link.href + link.label}
              href={link.href}
              label={title}
              subtitle={subtitle}
              visual={visual?.kind === 'image' || visual?.kind === 'look' ? { imageUrl: visual.imageUrl } : null}
              onNavigate={onNavigate}
              aspect={/tipolog/i.test(column.title) ? '3/4' : '4/3'}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {column.links.map((link) => (
        <Link
          key={link.href + link.label}
          to={lp(link.href)}
          onClick={onNavigate}
          className={cn(
            'rounded-lg px-2 py-2.5 text-[14px] font-medium transition-colors',
            tone === 'design'
              ? 'text-idl-ink-soft hover:bg-idl-path-design hover:text-idl-brass'
              : 'text-idl-graphite-2 hover:bg-idl-tech-panel hover:text-idl-amber',
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

function MobileMegaDropdownPanel({
  item,
  onNavigate,
}: {
  item: Extract<NavItem, { kind: 'dropdown' }>
  onNavigate: () => void
}) {
  const lp = useLocalePath()
  const [subTab, setSubTab] = useState(0)
  const tone = item.id === 'arredo' ? 'design' : 'technical'
  const columns = item.panel.columns
  const activeColumn = columns[subTab]

  useEffect(() => {
    setSubTab(0)
  }, [item.id])

  if (item.id === 'attacco') {
    return <MobileAttaccoPanel item={item} onNavigate={onNavigate} />
  }

  return (
    <div>
      <Link
        to={lp(resolveNavDropdownHref(item.id, item.href))}
        onClick={onNavigate}
        className={cn(
          'mb-4 inline-flex items-center gap-1.5 text-[15px] font-bold transition-colors',
          tone === 'design' ? 'text-idl-brass hover:text-idl-brass-light' : 'text-idl-amber',
        )}
      >
        Tutto {item.label.toLowerCase()} →
      </Link>

      <MobileColumnSubTabs
        columns={columns}
        activeIndex={subTab}
        onChange={setSubTab}
        tone={tone}
      />

      {activeColumn ? (
        <MobileMegaColumnContent column={activeColumn} tone={tone} onNavigate={onNavigate} />
      ) : null}

      {item.panel.promo ? <MobilePromoCard promo={item.panel.promo} onNavigate={onNavigate} /> : null}
    </div>
  )
}

function MobileAttaccoPanel({
  item,
  onNavigate,
}: {
  item: Extract<NavItem, { kind: 'dropdown' }>
  onNavigate: () => void
}) {
  const lp = useLocalePath()
  const panel = item.panel

  return (
    <div>
      <Link
        to={lp('/attacco')}
        onClick={onNavigate}
        className="mb-3 inline-flex items-center gap-1.5 text-[15px] font-bold text-idl-amber"
      >
        Tutti gli attacchi →
      </Link>
      <p className="mb-4 font-mono text-[10px] tracking-[0.12em] text-idl-amber uppercase">
        {panel.eyebrow ?? 'Lampadine per attacco'}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {MEGA_SOCKETS.map((socket) => (
          <Link
            key={socket.key}
            to={lp(socket.href)}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-xl border border-idl-tech-border bg-white p-3 transition hover:border-idl-amber"
          >
            <AttaccoSocketIcon icon={socket.icon} size={26} />
            <div className="min-w-0">
              <div className="font-mono text-[13px] font-semibold text-idl-graphite">{socket.code}</div>
              <div className="truncate text-[10.5px] text-idl-muted">{socket.hint}</div>
            </div>
          </Link>
        ))}
        <Link
          to={lp('/attacco')}
          onClick={onNavigate}
          className="col-span-2 flex items-center justify-center rounded-xl border border-dashed border-idl-tech-border bg-idl-tech-panel p-3.5 text-center"
        >
          <span className="text-[13px] font-bold text-idl-graphite-2">
            {panel.allSocketsCta ?? 'Tutti gli attacchi →'}
          </span>
        </Link>
      </div>
      {panel.promo ? <MobilePromoCard promo={panel.promo} onNavigate={onNavigate} /> : null}
    </div>
  )
}

function MobileAmbientiPanel({ onNavigate }: { onNavigate: () => void }) {
  const lp = useLocalePath()
  const { pages } = useSnapshot(siteStore)
  const home = pages.home as HomePageContent | undefined
  const rooms = home?.rooms.items?.length ? home.rooms.items : FALLBACK_ROOM_ITEMS

  return (
    <div>
      <Link
        to={lp('/acquista-ambiente')}
        onClick={onNavigate}
        className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-idl-brass"
      >
        Tutti gli ambienti →
      </Link>
      <div className="grid grid-cols-2 gap-2.5">
        {rooms.map((room) => (
          <MobileVisualLink
            key={room.href}
            href={room.href}
            label={room.title}
            visual={{ imageUrl: room.imageUrl, videoUrl: room.videoUrl }}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

function MobileBrandPanel({ onNavigate }: { onNavigate: () => void }) {
  const lp = useLocalePath()
  const { pages } = useSnapshot(siteStore)
  const home = pages.home as HomePageContent | undefined
  const brands = home?.brands.items ?? []

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

  return (
    <div>
      <Link
        to={lp('/brand')}
        onClick={onNavigate}
        className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-idl-brass"
      >
        Tutti i brand →
      </Link>
      <div className="grid grid-cols-2 gap-2">
        {brands.map((brand, index) => {
          const name = typeof brand === 'string' ? brand : brand.name
          const href = typeof brand === 'string' ? `/brand/${slugify(name)}` : (brand.href ?? `/brand/${slugify(name)}`)
          const look = resolveStyleLookVisual(index)
          return (
            <Link
              key={name}
              to={lp(href)}
              onClick={onNavigate}
              className="group overflow-hidden rounded-xl border border-idl-border bg-white transition hover:border-idl-brass"
            >
              <div className="relative aspect-[5/3] overflow-hidden bg-idl-cream">
                <SiteImage
                  src={look.imageUrl}
                  alt=""
                  fill
                  sizes="45vw"
                  className="object-cover opacity-80 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-idl-ink/55 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-2.5 font-serif text-[14px] font-semibold text-white">
                  {name}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function MobileGuidePanel({ onNavigate }: { onNavigate: () => void }) {
  const lp = useLocalePath()
  const { pages } = useSnapshot(siteStore)
  const home = pages.home as HomePageContent | undefined
  const guides = home?.guides.items ?? []

  return (
    <div>
      <Link
        to={lp('/blog')}
        onClick={onNavigate}
        className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-idl-brass"
      >
        Tutte le guide →
      </Link>
      <div className="flex flex-col gap-2.5">
        {guides.map((guide, index) => {
          const look = resolveStyleLookVisual(index + 2)
          return (
            <Link
              key={guide.href}
              to={lp(guide.href)}
              onClick={onNavigate}
              className="group flex gap-3 overflow-hidden rounded-xl border border-idl-border bg-white p-2 transition hover:border-idl-brass"
            >
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-idl-cream">
                <SiteImage src={look.imageUrl} alt="" fill sizes="72px" className="object-cover" />
              </div>
              <div className="min-w-0 py-0.5">
                <div className="font-mono text-[9px] tracking-[0.12em] text-idl-brass uppercase">
                  {guide.category}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-snug text-idl-ink">
                  {guide.title}
                </div>
                <div className="mt-1 text-[11px] text-idl-muted">{guide.meta}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function MobileAltroPanel({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n()

  const quickLinks = [
    { label: t('nav.catalog'), href: '/negozio', imageUrl: '/site/images/lamp-pendant.webp' },
    { label: t('nav.wishlist'), href: '/wishlist', imageUrl: '/site/images/lamp-sphere.webp' },
    { label: 'Professionisti', href: '/professionisti', imageUrl: '/site/images/room-studio.webp' },
    { label: 'Showroom Roma', href: '/showroom', imageUrl: '/site/images/room-soggiorno.webp' },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5">
        {quickLinks.map((link) => (
          <MobileVisualLink
            key={link.href}
            href={link.href}
            label={link.label}
            visual={{ imageUrl: link.imageUrl }}
            onNavigate={onNavigate}
            aspect="4/3"
          />
        ))}
      </div>
      <div className="flex flex-col gap-1 border-t border-idl-border/60 pt-4">
        <HeaderAccountMenu variant="mobileNav" onNavigate={onNavigate} />
        <HeaderThemeToggle variant="mobileNav" />
        <LanguageSwitcher variant="mobileNav" onLocaleChange={onNavigate} />
      </div>
    </div>
  )
}

export function MobileSiteMenu({ nav, activeNavId, onClose }: Props) {
  const lp = useLocalePath()
  const tabs = useMemo(
    () => [
      ...nav.items.map((item) => ({ id: item.id, label: item.label })),
      { id: 'altro', label: 'Altro' },
    ],
    [nav.items],
  )

  const defaultTab = activeNavId && tabs.some((tab) => tab.id === activeNavId) ? activeNavId : tabs[0]?.id ?? 'altro'
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const activeItem = nav.items.find((item) => item.id === activeTab)

  const tabTone = (id: string): 'design' | 'technical' | 'neutral' => {
    if (id === 'arredo') return 'design'
    if (id === 'tecnico' || id === 'attacco') return 'technical'
    return 'neutral'
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className={ui.mobileMenu}
    >
      <div className={cn(ui.mobileMenuBar, SITE_PAGE_X_CLASS)}>
        <Link to={lp('/')} className="rounded-sm transition-opacity hover:opacity-80" onClick={onClose}>
          <BrandWordmark className="text-[20px] md:text-[22px]" />
        </Link>
        <button
          type="button"
          aria-label="Chiudi menu"
          className={cn(ui.interactive, ui.mobileMenuClose)}
          onClick={onClose}
        >
          <MobileMenuCloseIcon className="size-5" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Navigazione"
        className={cn('flex shrink-0 gap-1.5 overflow-x-auto border-b border-idl-border py-2.5 scrollbar-none', SITE_PAGE_X_CLASS)}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id
          const tone = tabTone(tab.id)
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition',
                selected
                  ? tone === 'design'
                    ? 'bg-idl-design text-idl-glow'
                    : tone === 'technical'
                      ? 'bg-idl-amber/15 text-idl-amber'
                      : 'bg-idl-brass/15 text-idl-brass'
                  : 'text-idl-ink-soft hover:text-idl-ink',
              )}
            >
              {shortMobileTabLabel(tab.id, tab.label)}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        className={cn('flex-1 overflow-y-auto py-5', SITE_PAGE_X_CLASS)}
      >
        {activeTab === 'altro' ? (
          <MobileAltroPanel onNavigate={onClose} />
        ) : activeItem?.kind === 'dropdown' ? (
          <MobileMegaDropdownPanel item={activeItem} onNavigate={onClose} />
        ) : activeItem?.id === 'ambienti' ? (
          <MobileAmbientiPanel onNavigate={onClose} />
        ) : activeItem?.id === 'brand' ? (
          <MobileBrandPanel onNavigate={onClose} />
        ) : activeItem?.id === 'guide' ? (
          <MobileGuidePanel onNavigate={onClose} />
        ) : activeItem?.kind === 'link' ? (
          <Link
            to={lp(activeItem.href)}
            onClick={onClose}
            className={cn('text-[15px] font-semibold', ui.headerNavLink)}
          >
            {activeItem.label} →
          </Link>
        ) : null}
      </div>
    </div>
  )
}
