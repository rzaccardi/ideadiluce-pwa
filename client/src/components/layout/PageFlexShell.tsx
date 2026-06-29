import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type PageFlexTone = 'paper' | 'tech-panel' | 'white'

const TONE_BG: Record<PageFlexTone, string> = {
  paper: 'bg-idl-paper',
  'tech-panel': 'bg-idl-tech-panel',
  white: 'bg-idl-tech-panel',
}

/** Classe flex condivisa per pagine e transizioni di caricamento. */
export const PAGE_FLEX_LAYOUT_CLASS = 'flex min-h-0 flex-1 flex-col'

export function PageFlexShell({
  children,
  tone = 'paper',
  className,
}: {
  children: ReactNode
  tone?: PageFlexTone
  className?: string
}) {
  return (
    <div className={cn('flex min-h-full flex-1 flex-col', TONE_BG[tone], className)}>
      {children}
    </div>
  )
}

export function PageFlexBody({
  children,
  tone,
  className,
}: {
  children: ReactNode
  tone?: PageFlexTone
  className?: string
}) {
  return (
    <section className={cn('flex-1', tone ? TONE_BG[tone] : undefined, className)}>
      {children}
    </section>
  )
}
