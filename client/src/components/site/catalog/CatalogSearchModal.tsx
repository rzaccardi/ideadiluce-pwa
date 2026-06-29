'use client'

import { useI18n } from '@/hooks/use-i18n'
import { useGlobalSearch } from '@/context/global-search-context'
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

export function HeaderCatalogSearch() {
  const { t } = useI18n()
  const { openSearch } = useGlobalSearch()

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
