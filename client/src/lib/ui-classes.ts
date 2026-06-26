/** Classi Tailwind condivise — design system IdeaDiLuce (idl-*). */
export const ui = {
  /** Transizione colore leggera — stesso feeling dei link testuali. */
  interactive: 'cursor-pointer transition-colors duration-150',
  /** Button testuali in nav/menu: reset browser + hover come i link. */
  navButton:
    'cursor-pointer border-0 bg-transparent p-0 font-inherit text-inherit transition-colors duration-150',
  ctaInk: 'cursor-pointer transition-colors duration-150 hover:bg-[#2a2d35]',
  ctaAmber: 'cursor-pointer transition-colors duration-150 hover:bg-[#c2730f]',
  ctaGlow: 'cursor-pointer transition-colors duration-150 hover:bg-[#f7bd6f]',
  input:
    'w-full rounded-lg border border-idl-border bg-white px-3 py-2 text-idl-graphite outline-none transition placeholder:text-idl-placeholder focus:border-idl-brass focus:ring-2 focus:ring-idl-brass/20',
  inputSm: 'rounded border border-idl-border bg-white px-2 py-1.5 text-sm text-idl-graphite outline-none focus:border-idl-brass',
  select:
    'mt-1 w-full rounded border border-idl-border bg-white px-2 py-1.5 text-idl-graphite outline-none focus:border-idl-brass',
  chip:
    'rounded-full border border-idl-border bg-idl-cream px-3 py-1.5 font-mono text-[12px] text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-white',
  chipInteractive:
    'rounded-full border border-idl-border bg-idl-cream px-3 py-1 text-xs text-idl-ink-soft transition hover:border-idl-border-strong hover:bg-white',
  card: 'overflow-hidden rounded-lg border border-idl-tech-border bg-white transition hover:border-idl-border-strong',
  cardElevated: 'rounded-lg border border-idl-border bg-white shadow-sm shadow-idl-ink/5',
  panel: 'rounded-xl border border-idl-border bg-white p-4',
  panelMuted: 'rounded-lg border border-idl-border bg-idl-cream p-3',
  label: 'font-medium text-idl-graphite',
  labelSm: 'text-sm font-medium text-idl-graphite',
  muted: 'text-idl-muted',
  mutedSm: 'text-sm text-idl-muted',
  divider: 'border-idl-border',
  dividerSubtle: 'border-idl-border/60',
} as const
