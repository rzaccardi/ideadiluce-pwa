'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useGlobalSearch } from '@/context/global-search-context'
import { CatalogSearchTrigger } from '@/components/site/catalog/CatalogSearchTrigger'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

type Props = {
  variant?: 'icon' | 'bar'
  className?: string
}

export function HeaderCatalogSearch({ variant = 'icon', className }: Props) {
  const { t } = useI18n()
  const { openSearch } = useGlobalSearch()

  if (variant === 'bar') {
    return (
      <div className={cn('relative', className)}>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-idl-ink-soft" />
        <CatalogSearchTrigger
          searchSource="palette"
          variant="header"
          placeholder={t('catalog.searchPlaceholder')}
          ctaLabel={t('catalog.search')}
          showCta={false}
          showHints={false}
          aria-label={t('header.openSearch')}
          className="w-full"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      className={cn(ui.interactive, ui.headerAction, ui.headerActionBtn)}
      aria-label={t('header.openSearch')}
      aria-keyshortcuts="Control+K Meta+K"
    >
      <SearchIcon className="size-[18px]" />
    </button>
  )
}
