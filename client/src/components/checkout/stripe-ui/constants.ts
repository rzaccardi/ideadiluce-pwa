/** Paesi supportati nel selettore checkout (ISO 3166-1 alpha-2). */
export const CHECKOUT_COUNTRIES: Array<{ code: string; label: string }> = [
  { code: 'IT', label: 'Italia' },
  { code: 'FR', label: 'Francia' },
  { code: 'DE', label: 'Germania' },
  { code: 'ES', label: 'Spagna' },
  { code: 'AT', label: 'Austria' },
  { code: 'BE', label: 'Belgio' },
  { code: 'CH', label: 'Svizzera' },
  { code: 'GB', label: 'Regno Unito' },
  { code: 'NL', label: 'Paesi Bassi' },
  { code: 'PT', label: 'Portogallo' },
  { code: 'US', label: 'Stati Uniti' },
]

export const CHECKOUT_STORE_NAME = 'Idea di Luce'

/** Importo totale in sidebar checkout. */
export const checkoutTitleTypographyClass =
  'text-xl font-semibold tracking-tight sm:text-2xl'

/** Titolo form («Completa il tuo ordine»): più piccolo su mobile, più grande su desktop. */
export const checkoutFormTitleClass =
  'text-lg font-semibold leading-tight tracking-tight sm:text-xl md:text-2xl lg:text-[1.75rem] xl:text-3xl'

/** Gutter orizzontale condiviso tra colonne checkout. */
export const checkoutColumnGutterClass = 'px-4 sm:px-5 md:px-6 lg:px-8 xl:px-12'

/** Larghezza massima del blocco form nel main. */
export const checkoutFormColumnClass = 'mx-auto w-full max-w-[540px]'

/** Shell pagina: colonna singola mobile, due colonne da lg. */
export const checkoutShellClass = [
  'checkout-root checkout-shell',
  'flex min-h-dvh w-full flex-col overflow-x-hidden',
  'lg:grid lg:grid-cols-[minmax(300px,38%)_minmax(0,1fr)]',
].join(' ')

/** Main checkout: colonna form bianca, scroll indipendente su desktop. */
export const checkoutMainClass = [
  'flex w-full min-w-0 flex-1 flex-col bg-white',
  'lg:col-start-2 lg:row-start-1 lg:min-h-dvh lg:overflow-y-auto',
].join(' ')

/** Contenuto colonna destra (form). */
export const checkoutFormContentClass = [
  checkoutFormColumnClass,
  'w-full flex-1 py-5 sm:py-6 md:py-8',
  checkoutColumnGutterClass,
  'lg:py-10 xl:py-[46px]',
  'pb-[max(1.25rem,env(safe-area-inset-bottom))]',
].join(' ')

/** Contenuto interno colonna sinistra (riepilogo scuro). */
export const checkoutSummaryInnerClass = [
  'flex min-h-0 w-full flex-1 flex-col py-5 sm:py-6 md:py-8',
  checkoutColumnGutterClass,
  'lg:py-10 xl:py-[46px]',
].join(' ')

/** Sidebar checkout desktop — occupa la prima colonna della grid. */
export const checkoutSummaryAsideClass = [
  'hidden min-h-0 min-w-0 bg-[var(--checkout-bg-dark,#16130d)]',
  'lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-dvh lg:flex-col lg:overflow-y-auto',
].join(' ')

/** Barra riepilogo mobile collassabile, sticky in cima. */
export const checkoutMobileSummaryClass =
  'sticky top-0 z-20 border-b border-[#e2e6eb] bg-[#f7f8fa] lg:hidden'

/** Pulsante indietro: stessa cap-height del titolo a ogni breakpoint. */
export const checkoutBackButtonSizeClass = 'size-7 shrink-0 sm:size-8'

/** Palette checkout — allineata al mock IdeaDiLuce Checkout. */
export const CHECKOUT_BRAND = {
  fg: '#14161b',
  fgMuted: '#6c727c',
  fgSubtle: '#9298a3',
  fgWarm: '#9a8e78',
  fgCream: '#f1e8d8',
  border: '#e2e6eb',
  surfaceMuted: '#f7f8fa',
  surfaceDark: '#1f1a12',
  primary: '#14161b',
  primaryHover: '#2a2d35',
  accent: '#f0ad57',
  accentStrong: '#d9831a',
  accentHover: '#c2730f',
  accentSoft: '#faf6ef',
} as const

export function checkoutCountryLabel(code: string) {
  return CHECKOUT_COUNTRIES.find((c) => c.code === code)?.label ?? code
}

export const checkoutStripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: CHECKOUT_BRAND.primary,
    colorBackground: '#ffffff',
    colorText: CHECKOUT_BRAND.fg,
    colorDanger: '#dc2626',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    spacingUnit: '4px',
    borderRadius: '6px',
  },
  rules: {
    '.Input': {
      border: `1px solid ${CHECKOUT_BRAND.border}`,
      boxShadow: 'none',
    },
    '.Label': {
      fontWeight: '500',
    },
  },
}
