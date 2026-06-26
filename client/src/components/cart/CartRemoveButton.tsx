'use client'

import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  onClick: () => void
  disabled?: boolean
  /** Su sfondo scuro (checkout sidebar). */
  theme?: 'light' | 'dark'
  className?: string
}

export function CartRemoveButton({
  onClick,
  disabled = false,
  theme = 'light',
  className,
}: Props) {
  const { t } = useI18n()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-600 transition disabled:cursor-not-allowed disabled:opacity-50',
        dark ? 'hover:bg-white/10 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-700',
        className,
      )}
      aria-label={t('cart.remove')}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none">
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  )
}
