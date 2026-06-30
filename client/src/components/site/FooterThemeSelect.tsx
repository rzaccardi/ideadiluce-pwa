'use client'

import { SITE_THEMES, useTheme, type SiteTheme } from '@/context/theme-context'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import type { MessageKey } from '@/i18n/messages'

const THEME_LABEL_KEY: Record<SiteTheme, MessageKey> = {
  classic: 'theme.option.classic',
  light: 'theme.option.light',
  dark: 'theme.option.dark',
}

export function FooterThemeSelect() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  return (
    <label className="flex w-full items-center gap-2 sm:inline-flex sm:w-auto">
      <span className="sr-only">{t('theme.switcher.title')}</span>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as SiteTheme)}
        aria-label={t('theme.switcher.title')}
        className={cn(
          'w-full cursor-pointer rounded-md border border-white/20 bg-idl-design-elevated py-1.5 pr-7 pl-2.5 sm:w-auto',
          'text-[12px] font-medium text-idl-design-fg outline-none',
          'appearance-none bg-[length:10px] bg-position-[right_0.6rem_center] bg-no-repeat',
          'focus:border-idl-glow focus:ring-2 focus:ring-idl-glow/25',
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23c9a24b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        }}
      >
        {SITE_THEMES.map((option) => (
          <option key={option} value={option}>
            {t(THEME_LABEL_KEY[option])}
          </option>
        ))}
      </select>
    </label>
  )
}
