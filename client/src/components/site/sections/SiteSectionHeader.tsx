import { Link } from '@/lib/navigation'
import { Eyebrow } from '../primitives'
import { cn } from '@/utils/cn'
import type { LocalePathFn } from './types'

const LINK_TONE_CLASS = {
  brass: 'text-idl-brass',
  amber: 'text-idl-amber',
  glow: 'text-idl-glow font-semibold',
} as const

const TITLE_STYLE_CLASS = {
  'serif-lg': 'font-serif text-[34px] font-medium',
  'serif-md': 'font-serif text-[30px] font-medium text-idl-ink',
  'sans-lg': 'text-[30px] font-extrabold tracking-tight',
  'sans-md': 'text-[26px] font-extrabold tracking-tight',
  'serif-sm': 'font-serif text-2xl font-medium text-idl-ink',
} as const

type Props = {
  eyebrow?: string
  eyebrowVariant?: 'design' | 'technical' | 'neutral'
  title: string
  subtitle?: string
  linkHref?: string
  linkLabel?: string
  linkTone?: keyof typeof LINK_TONE_CLASS
  titleStyle?: keyof typeof TITLE_STYLE_CLASS
  subtitleClassName?: string
  layout?: 'stacked' | 'split'
  className?: string
  lp: LocalePathFn
}

export function SiteSectionHeader({
  eyebrow,
  eyebrowVariant = 'design',
  title,
  subtitle,
  linkHref,
  linkLabel,
  linkTone = 'brass',
  titleStyle = 'sans-md',
  subtitleClassName,
  layout = 'stacked',
  className,
  lp,
}: Props) {
  const heading = (
    <div>
      {eyebrow ? <Eyebrow variant={eyebrowVariant}>{eyebrow}</Eyebrow> : null}
      <h2 className={cn('mt-3', TITLE_STYLE_CLASS[titleStyle])}>{title}</h2>
      {subtitle ? (
        <p className={cn('mt-1 text-sm text-idl-muted', subtitleClassName)}>{subtitle}</p>
      ) : null}
    </div>
  )

  const link =
    linkHref && linkLabel ? (
      <Link to={lp(linkHref)} className={cn('text-sm font-bold', LINK_TONE_CLASS[linkTone])}>
        {linkLabel}
      </Link>
    ) : null

  if (layout === 'split') {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
          className,
        )}
      >
        {heading}
        {link}
      </div>
    )
  }

  return (
    <div className={className}>
      {heading}
      {link ? <div className="mt-3">{link}</div> : null}
    </div>
  )
}
