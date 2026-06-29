/** Classi Tailwind condivise — design system IdeaDiLuce (idl-*). */
export const ui = {
  /** Transizione colore leggera — stesso feeling dei link testuali. */
  interactive: 'cursor-pointer transition-colors duration-150',
  /** Button testuali in nav/menu: reset browser + hover come i link. */
  navButton:
    'cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit transition-colors duration-150',
  ctaInk: 'cursor-pointer transition-colors duration-150 hover:bg-idl-cta-ink-hover',
  ctaAmber: 'cursor-pointer transition-colors duration-150 hover:bg-idl-cta-amber-hover',
  ctaGlow: 'cursor-pointer transition-colors duration-150 hover:bg-idl-cta-glow-hover',
  input:
    'w-full rounded-lg border border-idl-border bg-idl-tech-panel px-3 py-2 text-idl-graphite outline-none transition placeholder:text-idl-placeholder focus:border-idl-brass focus:ring-2 focus:ring-idl-brass/20',
  inputSm:
    'rounded border border-idl-border bg-idl-tech-panel px-2 py-1.5 text-sm text-idl-graphite outline-none focus:border-idl-brass',
  select:
    'mt-1 w-full rounded border border-idl-border bg-idl-tech-panel px-2 py-1.5 text-idl-graphite outline-none focus:border-idl-brass',
  chip:
    'rounded-full border border-idl-border bg-idl-cream px-3 py-1.5 font-mono text-[12px] text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-idl-tech-panel',
  chipInteractive:
    'rounded-full border border-idl-border bg-idl-cream px-3 py-1 text-xs text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-idl-tech-panel',
  card: 'overflow-hidden rounded-lg border border-idl-tech-border bg-idl-tech-panel transition hover:border-idl-border-strong',
  cardElevated:
    'rounded-lg border border-idl-border bg-idl-tech-panel shadow-sm shadow-idl-ink/5',
  panel: 'rounded-xl border border-idl-border bg-idl-tech-panel p-4',
  panelMuted: 'rounded-lg border border-idl-border bg-idl-cream p-3',
  label: 'font-medium text-idl-graphite',
  labelSm: 'text-sm font-medium text-idl-graphite',
  muted: 'text-idl-muted',
  mutedSm: 'text-sm text-idl-muted',
  divider: 'border-idl-border',
  dividerSubtle: 'border-idl-border/60',
  /** Pulsanti header: solo icona sotto lg, testo da desktop. */
  headerAction:
    'inline-flex size-[38px] shrink-0 items-center justify-center gap-2 rounded-full border p-0 text-sm font-bold lg:size-auto lg:px-4 lg:py-2',
  headerActionText: 'hidden lg:inline',
  /** Header / utility bar — reattivo al tema via token superficie. */
  headerBar: 'border-b border-idl-border bg-idl-paper text-idl-ink-soft',
  headerNavLink: 'text-idl-ink-soft transition-colors hover:text-idl-ink',
  headerNavLinkActive: 'text-idl-brass hover:text-idl-brass-light',
  utilityBar: 'hidden border-b border-idl-border bg-idl-cream text-[12.5px] text-idl-ink-soft lg:block',
  utilityBarLink: 'transition-colors hover:text-idl-ink',
  mobileMenu: 'fixed inset-0 z-[60] flex min-h-dvh flex-col bg-idl-paper text-idl-ink-soft lg:hidden',
  mobileMenuBar: 'flex shrink-0 items-center justify-between border-b border-idl-border py-4',
  mobileMenuClose:
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-idl-border-strong bg-idl-tech-panel text-idl-ink-soft transition-colors hover:text-idl-ink',
  hamburgerBar: 'h-0.5 bg-idl-ink-soft',
  headerActionBtn:
    'border-idl-border-strong bg-idl-tech-panel text-idl-ink-soft hover:border-idl-brass hover:text-idl-ink',
  headerDropdown:
    'absolute right-0 top-full z-50 mt-2 rounded-[14px] border border-idl-border bg-idl-tech-panel p-2 shadow-[0_20px_54px_rgba(0,0,0,0.2)]',
  headerDropdownItem:
    'flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] font-semibold no-underline transition text-idl-graphite-2 hover:bg-idl-path-design hover:text-idl-brass',
  headerDropdownDivider: 'mx-2 my-1.5 h-px bg-idl-tech-border',
} as const
