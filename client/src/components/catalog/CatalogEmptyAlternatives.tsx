'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { EmptyState } from '@/components/EmptyState'
import { siteButtons } from '@/styles/site-ui'
import { cn } from '@/utils/cn'

type Props = {
  title?: string
  description?: string
  className?: string
  /** Compact: solo messaggio + CTA inline (per ProductGrid / slider). */
  compact?: boolean
}

/**
 * Empty state catalogo con alternative sempre presenti:
 * ricerca avanzata (/negozio) e richiesta prodotto.
 */
export function CatalogEmptyAlternatives({
  title,
  description,
  className,
  compact = false,
}: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()
  const resolvedTitle = title ?? t('catalog.emptyTitle')
  const resolvedDescription = description ?? t('catalog.emptyDescription')

  const actions = (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-3',
        compact ? 'mt-5' : undefined,
      )}
    >
      <Link to={lp('/negozio')} className={cn(siteButtons.base, siteButtons.primary, siteButtons.md)}>
        {t('catalog.empty.searchCta')}
      </Link>
      <Link
        to={lp('/prodotto-non-trovato')}
        className={cn(siteButtons.base, siteButtons.secondary, siteButtons.md)}
      >
        {t('catalog.empty.requestCta')}
      </Link>
    </div>
  )

  if (compact) {
    return (
      <div className={cn('py-10 text-center', className)}>
        <p className="text-sm font-medium text-idl-graphite">{resolvedTitle}</p>
        <p className="mt-2 text-sm text-idl-muted">{resolvedDescription}</p>
        {actions}
      </div>
    )
  }

  return (
    <EmptyState
      title={resolvedTitle}
      description={resolvedDescription}
      className={className}
      action={actions}
    />
  )
}
