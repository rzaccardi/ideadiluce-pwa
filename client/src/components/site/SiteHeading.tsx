import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type SiteHeadingLevel = 1 | 2 | 3 | 4

type Props = {
  level: SiteHeadingLevel
  children: ReactNode
  className?: string
  id?: string
}

export function SiteHeading({ level, children, className, id }: Props) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4'
  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  )
}

/** Titolo card/lista sotto una sezione h2 — stile invariato, tag semantico h3. */
export function SiteCardHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <SiteHeading level={3} className={cn('text-base font-bold', className)}>
      {children}
    </SiteHeading>
  )
}

/** h2 di sezione non visibile: mantiene la gerarchia senza alterare il layout. */
export function SiteSectionSrTitle({ children }: { children: ReactNode }) {
  return (
    <SiteHeading level={2} className="sr-only">
      {children}
    </SiteHeading>
  )
}
