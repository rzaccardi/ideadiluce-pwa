import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import {
  SITE_PAGE_X_CLASS,
  siteLayout,
  siteTypography,
} from '@/styles/site-ui'

export { SITE_PAGE_X_CLASS }

export function SectionContainer({
  children,
  className,
  narrow,
}: {
  children: ReactNode
  className?: string
  narrow?: boolean
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        SITE_PAGE_X_CLASS,
        narrow ? siteLayout.containerNarrow : siteLayout.containerWide,
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Eyebrow({
  children,
  variant = 'design',
  className,
}: {
  children: ReactNode
  variant?: 'design' | 'technical' | 'neutral'
  className?: string
}) {
  const variantClass = {
    design: siteTypography.eyebrowDesign,
    technical: siteTypography.eyebrowTechnical,
    neutral: siteTypography.eyebrowNeutral,
  }[variant]

  return (
    <div className={cn(siteTypography.eyebrow, variantClass, className)}>
      {children}
    </div>
  )
}

/** Wordmark ufficiale Idea di Luce (`/brand/ideadiluce*.svg`). */
export function BrandWordmark({
  className,
  inverted = false,
}: {
  className?: string
  /** @deprecated Non usato: il logo ufficiale non ha accent tipografico. */
  accentClassName?: string
  /** Versione bianca su sfondi scuri. */
  inverted?: boolean
}) {
  return (
    <img
      src={inverted ? '/brand/ideadiluce-white.svg' : '/brand/ideadiluce.svg'}
      alt="Idea di Luce"
      width={255}
      height={44}
      decoding="async"
      className={cn('h-[1em] w-auto select-none', className)}
      draggable={false}
    />
  )
}

/** Monogramma circolare Idl (`/brand/mark.png`). */
export function BrandMark({
  className,
  size = 36,
}: {
  className?: string
  size?: number
}) {
  return (
    <img
      src="/brand/mark.png"
      alt=""
      width={size}
      height={size}
      decoding="async"
      className={cn('select-none rounded-full object-cover', className)}
      draggable={false}
      aria-hidden
    />
  )
}
