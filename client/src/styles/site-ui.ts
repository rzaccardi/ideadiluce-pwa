/**
 * Costanti UI storefront — utility Tailwind basate sui design token.
 * Importa da qui invece di ripetere classi arbitrarie nei componenti.
 *
 * Per modificare l'aspetto globale, aggiorna `src/styles/tokens.css`.
 */

/** Padding orizzontale pagine: 16px mobile, 32px tablet, 48px desktop. */
export const SITE_PAGE_X_CLASS = 'px-4 md:px-8 lg:px-12'

export const siteLayout = {
  pageX: SITE_PAGE_X_CLASS,
  containerNarrow: 'max-w-idl-narrow',
  containerWide: 'max-w-idl-wide',
  containerAuth: 'max-w-idl-auth',
} as const

export const siteTypography = {
  eyebrow: 'font-mono text-idl-xs font-medium tracking-idl-widest uppercase',
  eyebrowDesign: 'text-idl-glow',
  eyebrowTechnical: 'text-idl-amber',
  eyebrowNeutral: 'text-idl-brass',
  wordmark:
    'font-serif text-idl-wordmark font-semibold tracking-idl-tight text-idl-ink',
  wordmarkAccent: 'italic text-idl-brass',
  h1: 'font-serif text-idl-3xl font-medium leading-tight text-idl-ink sm:text-idl-4xl',
  h2: 'font-serif text-idl-3xl font-medium text-idl-ink sm:text-idl-4xl',
  h3: 'font-serif text-idl-lg font-medium text-idl-ink sm:text-idl-xl',
  body: 'text-idl-body leading-idl-relaxed text-idl-ink-muted',
  bodyLg: 'text-idl-body-lg leading-idl-relaxed text-idl-ink-muted',
  label: 'text-idl-body-sm font-semibold text-idl-ink-soft',
  caption: 'text-idl-sm text-idl-muted',
  captionMono:
    'font-mono text-idl-2xs tracking-idl-normal uppercase sm:text-idl-xs',
  price: 'text-idl-body-lg font-bold text-idl-ink',
  priceLg: 'text-idl-lg font-extrabold text-idl-ink',
} as const

export const siteSurfaces = {
  page: 'bg-idl-paper text-idl-graphite',
  panel: 'rounded-idl-xl border border-idl-tech-border bg-white dark:bg-idl-tech-panel',
  card: 'rounded-idl-lg border border-idl-path-design-border bg-white dark:bg-idl-tech-panel',
  cardInteractive:
    'rounded-idl-lg border border-idl-path-design-border bg-white dark:bg-idl-tech-panel transition hover:border-idl-brass hover:shadow-idl-card',
  cardInteractiveLg:
    'rounded-idl-xl border border-idl-path-design-border bg-white dark:bg-idl-tech-panel transition hover:border-idl-brass hover:shadow-idl-card-hover',
  design: 'bg-idl-design text-idl-design-fg',
  designElevated: 'bg-idl-design-elevated text-idl-design-fg',
  designPanel: 'rounded-idl-xl border border-white/7 bg-idl-design-panel',
  promo: 'rounded-idl-lg border border-idl-promo-border bg-idl-promo-bg',
} as const

export const siteForms = {
  field:
    'flex min-w-0 items-center gap-2.5 rounded-idl-md border-[length:var(--border-width-idl-field)] border-idl-search-border bg-white px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-idl-brass focus-within:shadow-idl-focus dark:bg-idl-tech-panel sm:gap-2.5 sm:px-3.5',
  input:
    'min-w-0 flex-1 border-none bg-transparent py-3 text-base text-idl-ink outline-none placeholder:text-idl-placeholder sm:py-[13px] sm:text-idl-body-lg',
  label: siteTypography.label,
  checkbox:
    'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-idl-xs text-idl-sm text-white',
  checkboxChecked:
    'border-[length:var(--border-width-idl-field)] border-idl-brass bg-idl-brass',
  checkboxUnchecked:
    'border-[length:var(--border-width-idl-field)] border-idl-border-strong bg-transparent',
} as const

export const siteButtons = {
  base: 'inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
  primary: 'bg-idl-ink text-white hover:bg-idl-cta-ink-hover',
  secondary:
    'border border-idl-border-strong bg-idl-tech-panel text-idl-graphite hover:border-idl-brass/40 hover:bg-idl-cream',
  ghost: 'text-idl-ink-soft hover:bg-idl-cream hover:text-idl-graphite',
  accent: 'bg-idl-glow font-bold text-idl-design hover:bg-idl-cta-glow-hover',
  technical: 'bg-idl-amber font-bold text-white hover:bg-idl-cta-amber-hover',
  sm: 'rounded-idl-sm px-3 py-1.5 text-idl-sm',
  md: 'rounded-idl-sm px-4 py-2 text-idl-body',
  lg: 'rounded-idl-sm px-5 py-2.5 text-idl-body-lg',
  block:
    'flex min-h-12 w-full items-center justify-center rounded-idl-md border-none px-4 py-3.5 text-center text-idl-body-lg font-bold sm:py-4 sm:text-[15.5px]',
  pill:
    'rounded-idl-pill border border-idl-tech-border bg-idl-tech-panel px-4 py-2 text-idl-body-sm font-semibold text-idl-graphite-2 transition hover:border-idl-amber',
  pillActive:
    'rounded-idl-pill bg-idl-ink px-4 py-2 text-idl-body-sm font-bold text-white',
} as const

export const siteLinks = {
  brass:
    'font-bold text-idl-brass no-underline transition hover:text-idl-brass-light hover:underline',
  muted: 'text-idl-muted transition hover:text-idl-ink',
} as const

export const siteAuth = {
  shell: 'idl-auth-shell',
  glow: 'idl-auth-glow',
  glowOrb: 'idl-auth-glow__orb',
  card: 'idl-auth-card',
  cardInner: 'relative z-[2] w-full min-w-0 max-w-idl-auth',
  headerIcon:
    'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-idl-design sm:mb-[18px] sm:h-14 sm:w-14',
  footer:
    'mt-5 px-1 text-center text-idl-body-sm leading-idl-relaxed text-idl-ink-muted sm:mt-[22px] sm:px-0 sm:text-idl-body',
  footerMuted:
    'mt-2.5 px-1 text-center text-idl-body-sm leading-idl-relaxed text-idl-design-subtle sm:px-0',
} as const

/** Chip filtro catalogo */
export const siteChip = {
  base: 'inline-flex items-center gap-1.5 rounded-idl-pill border border-idl-tech-border bg-idl-tech-panel px-3 py-1.5 text-idl-body-sm text-idl-graphite-2',
  filterBar:
    'inline-flex items-center gap-1.5 rounded-idl-xl border border-idl-tech-border bg-idl-tech-panel px-3 py-2 text-idl-body-sm font-bold text-idl-ink transition hover:border-idl-ink',
} as const
