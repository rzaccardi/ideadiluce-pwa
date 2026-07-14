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

export function BrandWordmark({
  className,
  accentClassName,
}: {
  className?: string
  accentClassName?: string
}) {
  return (
    <span className={cn(siteTypography.wordmark, className)}>
      Idea<span className={cn(siteTypography.wordmarkAccent, accentClassName)}>di</span>Luce
    </span>
  )
}
