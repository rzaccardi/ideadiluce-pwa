'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import { Link, usePathname } from '@/lib/navigation'
import { useLocalePath } from '@/hooks/use-locale-path'
import type { DcActiveNavId } from '@/lib/dc-static-routes'
import type { SiteMegaMenuPanel, SiteShellContent } from '@/types/site-content'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { layers } from '@/lib/layering'
import { slideDownVariants, transitionBase } from '@/lib/motion/presets'
import dynamic from 'next/dynamic'
import { AttaccoMegaPanel } from './AttaccoMegaPanel'
import { SiteHeaderActions, SiteHeaderSearch } from './SiteHeaderActions'

const MobileSiteMenu = dynamic(() => import('./MobileSiteMenu').then((m) => ({ default: m.MobileSiteMenu })), {
  ssr: false,
})
import { BrandWordmark, SectionContainer } from './primitives'

function NavActiveBar({ tone }: { tone: 'design' | 'technical' | 'neutral' }) {
  return (
    <span
      className={cn(
        'absolute inset-x-0 -bottom-px h-0.5',
        tone === 'design' && 'bg-idl-brass',
        tone === 'technical' && 'bg-idl-amber',
        tone === 'neutral' && 'bg-idl-ink-soft',
      )}
    />
  )
}

function MegaPanel({
  panel,
  variant,
}: {
  panel: SiteMegaMenuPanel
  variant: 'design' | 'technical'
}) {
  const lp = useLocalePath()
  const reduceMotion = useReducedMotion()
  const dark = variant === 'design'
  const inner = (
    <SectionContainer className="flex flex-col gap-8 py-8 lg:flex-row lg:items-start">
      <div
        className={cn(
          'grid min-w-0 flex-1 gap-8',
          panel.columns.length >= 5 ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {panel.columns.map((col) => (
          <div key={col.title} className="min-w-0">
            <div
              className={cn(
                'mb-3.5 font-mono text-[10px] tracking-[0.14em] uppercase',
                dark ? 'text-idl-glow' : 'text-idl-amber',
              )}
            >
              {col.title}
            </div>
            <div className="flex flex-col gap-2 text-[13.5px]">
              {col.links.map((link) => (
                <Link
                  key={link.href + link.label}
                  to={lp(link.href)}
                  className={cn(
                    'transition-colors hover:underline',
                    dark ? 'text-idl-design-muted hover:text-idl-glow' : 'text-idl-graphite-2 hover:text-idl-amber',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      {panel.promo ? (
        <div
          className={cn(
            'w-full shrink-0 rounded-[10px] border p-5 lg:w-[240px]',
            panel.promo.variant === 'design'
              ? 'border-idl-glow/20 bg-idl-design-elevated'
              : 'border-idl-promo-border bg-idl-promo-bg',
          )}
        >
          <div
            className={cn(
              'mb-2 text-base font-bold',
              panel.promo.variant === 'design' ? 'font-serif text-idl-design-fg' : 'text-idl-graphite',
            )}
          >
            {panel.promo.title}
          </div>
          <p
            className={cn(
              'mb-4 text-[12.5px] leading-relaxed',
              panel.promo.variant === 'design' ? 'text-idl-design-subtle' : 'text-idl-promo-text',
            )}
          >
            {panel.promo.description}
          </p>
          <Link
            to={lp(panel.promo.ctaHref)}
            className={cn(
              'inline-block rounded-md px-4 py-2.5 text-[13px] font-bold whitespace-nowrap transition-colors',
              panel.promo.variant === 'design'
                ? 'bg-idl-glow text-idl-design hover:bg-idl-cta-glow-hover'
                : 'bg-idl-amber text-white hover:bg-idl-cta-amber-hover',
            )}
          >
            {panel.promo.ctaLabel}
          </Link>
        </div>
      ) : null}
    </SectionContainer>
  )

  const panelClass = cn(
    'absolute inset-x-0 top-full border-t shadow-2xl',
    layers.megaPanel,
    dark ? 'border-idl-glow/20 bg-idl-design text-idl-design-fg' : 'border-idl-tech-border bg-idl-tech-panel',
  )

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

export function SiteHeader({
  nav,
  footer,
  activeNavId = null,
}: {
  nav: SiteShellContent['nav']
  footer: SiteShellContent['footer']
  activeNavId?: DcActiveNavId | null
}) {
  const lp = useLocalePath()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!openMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openMenu])

  useEffect(() => {
    if (!mobileOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)

    const mq = window.matchMedia('(min-width: 1024px)')
    const onWide = () => {
      if (mq.matches) setMobileOpen(false)
    }
    mq.addEventListener('change', onWide)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onWide)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileOpen])

  const isDropdownActive = (id: string) => openMenu === id || (openMenu === null && activeNavId === id)

  const activeDropdown = nav.items.find(
    (item): item is Extract<(typeof nav.items)[number], { kind: 'dropdown' }> =>
      item.kind === 'dropdown' && item.id === openMenu,
  )

  const closeMenu = () => setOpenMenu(null)
  const closeMobileMenu = () => setMobileOpen(false)

  return (
    <>
      <AnimatePresence>
        {openMenu ? (
          <motion.button
            key="menu-backdrop"
            type="button"
            aria-label="Chiudi menu"
            className={cn('fixed inset-0 bg-idl-backdrop', layers.megaBackdrop)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitionBase}
            onClick={closeMenu}
          />
        ) : null}
      </AnimatePresence>
      <motion.header
        className={cn('relative', ui.headerBar)}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={slideDownVariants}
        transition={transitionBase}
      >
        <SectionContainer className="relative flex items-center justify-between gap-2 py-3 md:gap-3 md:py-4 lg:gap-2 lg:py-4">
          <div className="flex min-w-0 items-center gap-3 md:gap-6 lg:gap-10">
            <button
              type="button"
              className="flex flex-col gap-1 lg:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
              onClick={() => {
                setOpenMenu(null)
                setMobileOpen((v) => !v)
              }}
            >
              <span className={cn('w-5', ui.hamburgerBar)} />
              <span className={cn('w-5', ui.hamburgerBar)} />
              <span className={cn('w-3', ui.hamburgerBar)} />
            </button>
            <Link to={lp('/')} className="rounded-sm transition-opacity hover:opacity-80">
              <BrandWordmark className="text-[20px] md:text-[22px] lg:text-[25px]" />
            </Link>
            <nav className="hidden items-center gap-5 text-[14.5px] font-medium lg:flex">
              {nav.items.map((item) =>
                item.kind === 'link' ? (
                  <Link
                    key={item.id}
                    to={lp(item.href)}
                    className={cn(
                      'group relative py-1.5',
                      activeNavId === item.id
                        ? ui.headerNavLinkActive
                        : ui.headerNavLink,
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        'absolute inset-x-0 -bottom-px h-0.5 bg-idl-ink-soft transition-opacity duration-150',
                        activeNavId === item.id
                          ? 'opacity-100'
                          : 'opacity-0 group-hover:opacity-100',
                      )}
                    />
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'relative py-1.5 transition-colors',
                      isDropdownActive(item.id)
                        ? item.id === 'arredo'
                          ? ui.headerNavLinkActive
                          : 'text-idl-amber hover:text-idl-cta-amber-hover'
                        : ui.headerNavLink,
                    )}
                    onClick={() => setOpenMenu((cur) => (cur === item.id ? null : item.id))}
                  >
                    {item.label} ▾
                    {isDropdownActive(item.id) ? (
                      <NavActiveBar tone={item.id === 'arredo' ? 'design' : 'technical'} />
                    ) : null}
                  </button>
                ),
              )}
            </nav>
          </div>
          <div className="flex shrink-0 items-center lg:gap-4">
            <SiteHeaderSearch />
            <SiteHeaderActions />
          </div>
          <AnimatePresence>
            {activeDropdown?.id === 'attacco' ? (
              <AttaccoMegaPanel key="attacco" />
            ) : activeDropdown && activeDropdown.panel.columns.length > 0 ? (
              <MegaPanel
                key={activeDropdown.id}
                panel={activeDropdown.panel}
                variant={activeDropdown.id === 'arredo' ? 'design' : 'technical'}
              />
            ) : null}
          </AnimatePresence>
        </SectionContainer>
      </motion.header>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="mobile-nav"
            initial={reduceMotion ? false : { opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={transitionBase}
            className={cn('fixed inset-0 lg:hidden', layers.mobileNav)}
          >
            <MobileSiteMenu
              nav={nav}
              notFoundCta={footer.notFoundCta}
              activeNavId={activeNavId}
              onClose={closeMobileMenu}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
