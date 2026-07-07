'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio/react'
import { ExternalLink } from '@/lib/link-title'
import { Link } from '@/lib/navigation'
import { SHOWROOM_MAPS_URL } from '@/lib/company-contact'
import { isExternalHref } from '@/lib/href'
import { AttaccoSocketIcon } from '@/components/site/attacco/AttaccoIcons'
import { HeaderAccountMenu } from '@/components/site/HeaderAccountMenu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { authStore } from '@/features/auth'
import { SiteImage } from '@/components/site/SiteImage'
import { api } from '@/api/endpoints'
import { fetchSitePage, siteStore } from '@/features/site'
import { ATTACCO_SOCKETS } from '@/lib/attacco.defaults'
import { resolveNavDropdownHref } from '@/lib/dc-static-routes'
import {
  isDesignCategory,
  primaryCategoryLabel,
  resolveHomeBrandCards,
} from '@/lib/brand.defaults'
import {
  FALLBACK_GUIDE_ITEMS,
  FALLBACK_ROOM_ITEMS,
  isVisualColumn,
  resolveMenuLinkVisual,
  resolveMobileNavTabId,
  resolveNavLinkVisual,
  resolveStyleLookVisual,
  shortMobileTabLabel,
} from '@/lib/mobile-nav-visuals'
import { useI18n } from '@/hooks/use-i18n'
import { useLocale } from '@/context/locale-context'
import { useLocalePath } from '@/hooks/use-locale-path'
import type {
  BrandListItemDTO,
  HomeGuideCard,
  HomePageContent,
  SiteMegaMenuPanel,
  SiteShellContent,
} from '@/types/site-content'

type NotFoundCta = SiteShellContent['footer']['notFoundCta']
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { BrandNameDisplay } from './brand/BrandNameDisplay'
import { BrandWordmark, SITE_PAGE_X_CLASS } from './primitives'

const MEGA_SOCKETS = ATTACCO_SOCKETS.filter((socket) => !socket.dashed).slice(0, 5)

type NavItem = SiteShellContent['nav']['items'][number]

type Props = {
  nav: SiteShellContent['nav']
  notFoundCta: NotFoundCta
  activeNavId?: string | null
  onClose: () => void
}

function MobileMenuFooter({ notFoundCta, onClose }: { notFoundCta: NotFoundCta; onClose: () => void }) {
  const lp = useLocalePath()
  const auth = useSnapshot(authStore)

  return (
    <div className="mt-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 rounded-xl border border-idl-promo-border bg-idl-promo-bg p-4">
        <div className="font-serif text-[15px] font-medium text-idl-graphite">{notFoundCta.title}</div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-idl-promo-text">{notFoundCta.description}</p>
        <Link
          to={lp(notFoundCta.ctaHref)}
          onClick={onClose}
          className="mt-3 inline-block rounded-md bg-idl-amber px-3.5 py-2 text-[12.5px] font-bold text-white transition-colors hover:bg-idl-cta-amber-hover"
        >
          {notFoundCta.ctaLabel}
        </Link>
      </div>

      <div className="flex flex-col gap-0.5 border-t border-idl-border pt-4">
        <LanguageSwitcher variant="mobileNav" onLocaleChange={onClose} />
        {!auth.isAuthenticated ? (
          <HeaderAccountMenu variant="mobileNav" onNavigate={onClose} />
        ) : null}
      </div>
    </div>
  )
}

function MobileMenuCloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}

function MobileVisualLink({
  href,
  label,
  visual,
  subtitle,
  aspect = '4/3',
  onNavigate,
}: {
  href: string
  label: string
  visual?: { imageUrl: string; videoUrl?: string } | null
  subtitle?: string
  aspect?: '4/3' | '1/1' | '3/4'
  onNavigate?: () => void
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
}: {
  column: SiteMegaMenuPanel['columns'][number]
  tone: 'design' | 'technical'
}) {
  const lp = useLocalePath()
  const visualGrid = isVisualColumn(column.title)

  if (visualGrid) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        {column.links.map((link, index) => {
          const visual = resolveMenuLinkVisual(link, column.title, index)
          const subtitle =
            link.label.includes(' — ') ? link.label.split(' — ').slice(1).join(' — ') : undefined
          const title = link.label.split(' — ')[0] ?? link.label

          return (
            <MobileVisualLink
              key={link.href + link.label}
              href={link.href}
              label={title}
              subtitle={subtitle}
              visual={visual?.kind === 'image' || visual?.kind === 'look' ? { imageUrl: visual.imageUrl, videoUrl: visual.kind === 'image' ? visual.videoUrl : undefined } : null}
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

function MobileMegaDropdownPanel({ item }: { item: Extract<NavItem, { kind: 'dropdown' }> }) {
  const lp = useLocalePath()
  const [subTab, setSubTab] = useState(0)
  const tone = item.id === 'arredo' ? 'design' : 'technical'
  const columns = item.panel.columns
  const activeColumn = columns[subTab]

  useEffect(() => {
    setSubTab(0)
  }, [item.id])

  if (item.id === 'attacco') {
    return <MobileAttaccoPanel item={item} />
  }

  return (
    <div>
      <Link
        to={lp(resolveNavDropdownHref(item.id, item.href))}
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
        <MobileMegaColumnContent column={activeColumn} tone={tone} />
      ) : null}
    </div>
  )
}

function MobileAttaccoPanel({ item }: { item: Extract<NavItem, { kind: 'dropdown' }> }) {
  const lp = useLocalePath()
  const panel = item.panel

  return (
    <div>
      <Link
        to={lp('/attacco')}
        className="mb-3 inline-flex items-center gap-1.5 text-[15px] font-bold text-idl-amber"
      >
        Tutti gli attacchi →
      </Link>
      <p className="mb-4 font-mono text-[10px] tracking-[0.12em] text-idl-amber uppercase">
        {panel.eyebrow ?? 'Lampadine per attacco'}
      </p>
      <div className="flex flex-col gap-2">
        {MEGA_SOCKETS.map((socket) => (
          <Link
            key={socket.key}
            to={lp(socket.href)}
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
          className="flex items-center justify-center rounded-xl border border-dashed border-idl-tech-border bg-idl-tech-panel p-3.5 text-center"
        >
          <span className="text-[13px] font-bold text-idl-graphite-2">
            {panel.allSocketsCta ?? 'Tutti gli attacchi →'}
          </span>
        </Link>
      </div>
    </div>
  )
}

function enrichMobileRoomCard(
  item: Pick<HomePageContent['rooms']['items'][number], 'title' | 'href' | 'imageUrl' | 'videoUrl'>,
): HomePageContent['rooms']['items'][number] {
  const path = item.href.split('?')[0] ?? item.href
  const fallback = FALLBACK_ROOM_ITEMS.find((room) => room.href === path)
  const visual = resolveNavLinkVisual(item.href, item.title)

  return {
    title: item.title,
    href: item.href,
    imageUrl:
      item.imageUrl ||
      fallback?.imageUrl ||
      (visual?.kind === 'image' || visual?.kind === 'look' ? visual.imageUrl : ''),
    videoUrl:
      item.videoUrl ||
      fallback?.videoUrl ||
      (visual?.kind === 'image' ? visual.videoUrl : undefined),
  }
}

function MobileAmbientiPanel({ onClose }: { onClose: () => void }) {
  const lp = useLocalePath()
  const { pages } = useSnapshot(siteStore)
  const home = pages.home as HomePageContent | undefined
  const rooms = useMemo(() => {
    const source = home?.rooms.items?.length ? home.rooms.items : FALLBACK_ROOM_ITEMS
    return source.map(enrichMobileRoomCard)
  }, [home?.rooms.items])

  return (
    <div>
      <Link
        to={lp('/acquista-ambiente')}
        onClick={onClose}
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
            visual={
              room.imageUrl ? { imageUrl: room.imageUrl, videoUrl: room.videoUrl } : null
            }
            onNavigate={onClose}
          />
        ))}
      </div>
    </div>
  )
}

function MobileBrandPanel() {
  const lp = useLocalePath()
  const { locale } = useLocale()
  const { pages } = useSnapshot(siteStore)
  const home = pages.home as HomePageContent | undefined
  const [hubBrands, setHubBrands] = useState<BrandListItemDTO[]>([])

  useEffect(() => {
    void api.catalog
      .brands()
      .then((data) => setHubBrands(data.items))
      .catch(() => setHubBrands([]))
  }, [locale])

  const brands = useMemo(
    () => resolveHomeBrandCards(home?.brands.items ?? [], hubBrands),
    [home?.brands.items, hubBrands],
  )

  return (
    <div>
      <Link
        to={lp('/brand')}
        className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-bold text-idl-brass"
      >
        Tutti i brand →
      </Link>
      <div className="grid grid-cols-2 gap-2.5 overflow-hidden rounded-[10px] border border-idl-tech-border bg-white dark:bg-idl-tech-panel">
        {brands.map((brand) => {
          const design = isDesignCategory(brand.categories)
          const badge = primaryCategoryLabel(brand.categories)
          const productMeta =
            brand.productCount > 0 ? `${brand.productCount} prodotti` : 'Catalogo disponibile'

          return (
            <Link
              key={brand.slug}
              to={lp(brand.href)}
              className="flex min-h-[118px] flex-col items-center border-b border-r border-idl-tech-border bg-idl-tech-panel px-3 py-4 text-center transition hover:bg-white hover:text-idl-brass"
              aria-label={`Scopri ${brand.name}`}
            >
              <div className="mb-2.5 flex h-10 w-full items-center justify-center">
                <BrandNameDisplay name={brand.name} style={brand.displayStyle} size="sm" />
              </div>
              <span
                className={cn(
                  'inline-flex rounded-[5px] border px-2 py-0.5 font-mono text-[9px] tracking-[0.06em]',
                  design
                    ? 'border-[#ece2d2] bg-idl-path-design text-idl-brass'
                    : 'border-idl-tech-chip-border bg-idl-tech-chip text-idl-graphite-2',
                )}
              >
                {badge}
              </span>
              <span className="mt-1.5 text-[10.5px] text-idl-muted">{productMeta}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function MobileGuidePanel({ onClose }: { onClose: () => void }) {
  const lp = useLocalePath()
  const { locale } = useLocale()
  const { pages } = useSnapshot(siteStore)
  const home = pages.home as HomePageContent | undefined
  const [featuredGuides, setFeaturedGuides] = useState<HomeGuideCard[]>([])

  useEffect(() => {
    void api.site
      .guides(locale, { featured: true })
      .then((items) =>
        setFeaturedGuides(
          items.map((guide) => ({
            category: guide.category,
            title: guide.title,
            meta: guide.meta,
            href: guide.href,
          })),
        ),
      )
      .catch(() => setFeaturedGuides([]))
  }, [locale])

  const guides =
    featuredGuides.length > 0
      ? featuredGuides
      : home?.guides.items?.length
        ? home.guides.items
        : [...FALLBACK_GUIDE_ITEMS]

  return (
    <div>
      <Link
        to={lp('/blog')}
        onClick={onClose}
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
              onClick={onClose}
              className="group flex gap-3 overflow-hidden rounded-xl border border-idl-border bg-white p-2 transition hover:border-idl-brass"
            >
              <div className="relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-idl-cream">
                <SiteImage src={look.imageUrl} alt="" fill sizes="72px" className="object-cover" />
              </div>
              <div className="min-w-0 py-0.5">
                {guide.category ? (
                  <div className="font-mono text-[9px] tracking-[0.12em] text-idl-brass uppercase">
                    {guide.category}
                  </div>
                ) : null}
                <div className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-snug text-idl-ink">
                  {guide.title}
                </div>
                {guide.meta ? <div className="mt-1 text-[11px] text-idl-muted">{guide.meta}</div> : null}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function MobileAltroPanel() {
  const lp = useLocalePath()
  const { t } = useI18n()

  const quickLinks = [
    { label: t('nav.catalog'), href: '/negozio' },
    { label: t('nav.wishlist'), href: '/wishlist' },
    { label: 'Professionisti', href: '/professionisti' },
    { label: 'Showroom Roma', href: SHOWROOM_MAPS_URL },
  ]

  return (
    <div className="flex flex-col gap-1">
      {quickLinks.map((link) =>
        isExternalHref(link.href) ? (
          <ExternalLink
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-2 py-2.5 text-[14px] font-medium text-idl-ink-soft transition-colors hover:bg-idl-path-design hover:text-idl-brass"
          >
            {link.label}
          </ExternalLink>
        ) : (
          <Link
            key={link.href}
            to={lp(link.href)}
            className="rounded-lg px-2 py-2.5 text-[14px] font-medium text-idl-ink-soft transition-colors hover:bg-idl-path-design hover:text-idl-brass"
          >
            {link.label}
          </Link>
        ),
      )}
    </div>
  )
}

export function MobileSiteMenu({ nav, notFoundCta, activeNavId, onClose }: Props) {
  const lp = useLocalePath()
  const { locale } = useLocale()
  const tabs = useMemo(
    () => [
      ...nav.items.map((item, index) => ({
        id: resolveMobileNavTabId(item, index),
        label: item.label,
      })),
      { id: 'altro', label: 'Altro' },
    ],
    [nav.items],
  )

  const defaultTab = activeNavId && tabs.some((tab) => tab.id === activeNavId) ? activeNavId : tabs[0]?.id ?? 'altro'
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    void fetchSitePage('home', locale, { skipIfFresh: true })
  }, [locale])

  const activeItem = useMemo(
    () =>
      nav.items.find((item, index) => resolveMobileNavTabId(item, index) === activeTab),
    [nav.items, activeTab],
  )

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
        <Link to={lp('/')} className="rounded-sm transition-opacity hover:opacity-80">
          <BrandWordmark className="text-[20px] md:text-[22px]" />
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex size-10 items-center justify-center">
            <LanguageSwitcher variant="icon" onLocaleChange={onClose} />
          </div>
          <button
            type="button"
            aria-label="Chiudi menu"
            className={cn(ui.interactive, ui.mobileMenuClose)}
            onClick={onClose}
          >
            <MobileMenuCloseIcon className="size-5" />
          </button>
        </div>
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
        className={cn('min-h-0 flex-1 overflow-y-auto py-5', SITE_PAGE_X_CLASS)}
      >
        {activeTab === 'altro' ? (
          <MobileAltroPanel />
        ) : activeTab === 'ambienti' ? (
          <MobileAmbientiPanel onClose={onClose} />
        ) : activeTab === 'brand' ? (
          <MobileBrandPanel />
        ) : activeTab === 'guide' ? (
          <MobileGuidePanel onClose={onClose} />
        ) : activeItem?.kind === 'dropdown' ? (
          <MobileMegaDropdownPanel item={activeItem} />
        ) : activeItem?.kind === 'link' ? (
          <Link
            to={lp(activeItem.href)}
            className={cn('text-[15px] font-semibold', ui.headerNavLink)}
          >
            {activeItem.label} →
          </Link>
        ) : null}

        <MobileMenuFooter notFoundCta={notFoundCta} onClose={onClose} />
      </div>
    </div>
  )
}
