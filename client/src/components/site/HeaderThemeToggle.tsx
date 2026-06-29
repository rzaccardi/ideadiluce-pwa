'use client'

import { useTheme, type SiteTheme } from '@/context/theme-context'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import type { MessageKey } from '@/i18n/messages'

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

function ClassicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M12 3c-3.5 2.5-6 6.2-6 10.4a6 6 0 1 0 12 0C18 9.2 15.5 5.5 12 3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

const NEXT_THEME_LABEL: Record<SiteTheme, MessageKey> = {
  classic: 'theme.switcher.toLight',
  light: 'theme.switcher.toDark',
  dark: 'theme.switcher.toClassic',
}

export function HeaderThemeToggle() {
  const { theme, isDark, isClassic, toggleTheme } = useTheme()
  const { t } = useI18n()
  const nextLabel = t(NEXT_THEME_LABEL[theme])

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={nextLabel}
      aria-label={nextLabel}
      className={cn(
        ui.interactive,
        ui.headerAction,
        ui.headerActionBtn,
        isDark && 'text-idl-glow',
        isClassic && 'text-idl-amber',
      )}
    >
      {theme === 'dark' ? (
        <MoonIcon className="size-[18px]" />
      ) : theme === 'classic' ? (
        <ClassicIcon className="size-[18px]" />
      ) : (
        <SunIcon className="size-[18px] text-idl-brass" />
      )}
    </button>
  )
}
