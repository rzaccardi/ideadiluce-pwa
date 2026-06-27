'use client'

import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.6 1.6 M17.4 17.4L19 19 M19 5l-1.6 1.6 M6.6 17.4L5 19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M21 12.8A8 8 0 1 1 11.2 3a6 6 0 0 0 9.8 9.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function HeaderThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  const { t } = useI18n()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={t('theme.switcher.title')}
      aria-label={t('theme.switcher.title')}
      className={cn(
        ui.interactive,
        'inline-flex size-[38px] shrink-0 items-center justify-center rounded-full border p-0',
        isDark
          ? 'border-white/16 bg-white/6 text-white hover:border-white/40 hover:text-white'
          : 'border-idl-border-strong bg-white text-idl-brass hover:border-idl-brass',
      )}
    >
      {isDark ? (
        <MoonIcon className="size-[18px]" />
      ) : (
        <SunIcon className="size-[18px] text-idl-brass" />
      )}
    </button>
  )
}
