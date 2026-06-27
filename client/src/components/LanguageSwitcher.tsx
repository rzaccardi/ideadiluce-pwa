'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { PWA_LOCALES, LOCALE_LABEL, LOCALE_NAME, type PwaLocale } from '@/lib/locale'
import { localeFlagUrl } from '@/lib/locale-flags'
import { useLocale } from '@/context/locale-context'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

const FLAG_SIZE_TRIGGER = 24
const FLAG_SIZE_OPTION = 20

function LocaleFlag({
  locale,
  size,
}: {
  locale: PwaLocale
  size: typeof FLAG_SIZE_TRIGGER | typeof FLAG_SIZE_OPTION | 22
}) {
  const px =
    size === FLAG_SIZE_TRIGGER ? 'size-6' : size === 22 ? 'size-[22px]' : 'size-5'
  return (
    <img
      src={localeFlagUrl(locale)}
      alt=""
      width={size}
      height={size}
      className={cn('block max-w-none shrink-0 rounded-full', px)}
      decoding="async"
    />
  )
}

type Props = {
  theme?: 'light' | 'dark'
  variant?: 'icon' | 'header' | 'mobileNav'
  onOpenChange?: (open: boolean) => void
  /** Chiamato dopo la selezione di una lingua (es. chiudere il menu mobile). */
  onLocaleChange?: () => void
}

export function LanguageSwitcher({ theme, variant = 'icon', onOpenChange, onLocaleChange }: Props) {
  const { locale, switchLocale } = useLocale()
  const { isDark: themeDark } = useTheme()
  const { t, tParams } = useI18n()
  const dark = theme === 'dark' || (theme == null && themeDark)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const setMenuOpen = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      setMenuOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const selectLocale = (next: PwaLocale) => {
    switchLocale(next)
    setMenuOpen(false)
    onLocaleChange?.()
  }

  const isHeader = variant === 'header'
  const isMobileNav = variant === 'mobileNav'

  if (isMobileNav) {
    return (
      <div ref={rootRef} className={cn('border-t pt-4', dark ? 'border-white/10' : 'border-idl-border/60')}>
        <button
          type="button"
          onClick={() => setMenuOpen(!open)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-label={tParams('language.switcher.current', { locale: LOCALE_NAME[locale] })}
          className={cn(
            ui.interactive,
            'flex w-full items-center gap-3 rounded-md py-1 text-left transition-colors',
            dark ? 'text-idl-design-muted hover:text-idl-design-fg' : 'text-idl-ink-soft hover:text-idl-ink',
          )}
        >
          <LocaleFlag locale={locale} size={22} />
          <span className="flex-1">{LOCALE_NAME[locale]}</span>
          <span className="text-[10px] opacity-60" aria-hidden>
            {open ? '▴' : '▾'}
          </span>
        </button>

        {open ? (
          <div
            id={listId}
            role="listbox"
            aria-label={t('language.switcher.other')}
            className="mt-2 flex flex-col gap-1"
          >
            {PWA_LOCALES.map((loc) => {
              const selected = loc === locale
              return (
                <button
                  key={loc}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectLocale(loc)}
                  className={cn(
                    ui.navButton,
                    'flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-[15px] font-medium transition-colors',
                    selected
                      ? dark
                        ? 'text-idl-glow'
                        : 'text-idl-brass'
                      : dark
                        ? 'text-idl-design-muted hover:text-idl-design-fg'
                        : 'text-idl-ink-soft hover:text-idl-ink',
                  )}
                >
                  <LocaleFlag locale={loc} size={22} />
                  <span>{LOCALE_NAME[loc]}</span>
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={tParams('language.switcher.current', { locale: LOCALE_NAME[locale] })}
        className={cn(
          ui.interactive,
          ui.headerAction,
          isHeader
            ? cn(
                dark
                  ? 'border-white/16 bg-white/6 text-idl-design-fg hover:border-idl-glow/50 hover:text-idl-glow'
                  : 'border-idl-border-strong bg-white text-idl-ink-soft hover:border-idl-brass hover:text-idl-ink',
              )
            : cn(
                'size-6 rounded-full p-0 ring-2 ring-offset-2',
                dark
                  ? 'ring-white/25 ring-offset-black focus-visible:outline-white'
                  : 'ring-idl-ink ring-offset-idl-paper focus-visible:outline-idl-brass',
                open && (dark ? 'ring-white/50' : 'ring-idl-brass'),
              ),
        )}
      >
        <LocaleFlag locale={locale} size={isHeader ? 22 : FLAG_SIZE_TRIGGER} />
        {isHeader ? (
          <>
            <span className={cn(ui.headerActionText, 'text-[12.5px] tracking-wide')}>
              {LOCALE_LABEL[locale]}
            </span>
            <span className={cn(ui.headerActionText, 'text-[9px] opacity-60')} aria-hidden>
              ▾
            </span>
          </>
        ) : null}
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t('language.switcher.other')}
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-[188px] rounded-[14px] border p-2 shadow-[0_20px_54px_rgba(0,0,0,0.2)]',
            isHeader
              ? dark
                ? 'border-white/12 bg-idl-design-elevated'
                : 'border-idl-border bg-white'
              : 'flex w-max flex-col gap-1.5 rounded-xl border-idl-border bg-idl-paper/95 p-1 shadow-lg shadow-idl-ink/10 backdrop-blur-sm',
          )}
        >
          {PWA_LOCALES.map((loc) => {
            const selected = loc === locale
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={selected}
                title={LOCALE_NAME[loc]}
                onClick={() => selectLocale(loc)}
                className={cn(
                  ui.navButton,
                  'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13.5px] font-semibold',
                  isHeader
                    ? selected
                      ? dark
                        ? 'bg-white/10 text-idl-glow'
                        : 'bg-[#faf6ef] text-idl-brass'
                      : dark
                        ? 'text-idl-design-muted hover:bg-white/6 hover:text-idl-glow'
                        : 'text-idl-graphite-2 hover:bg-[#faf6ef] hover:text-idl-brass'
                    : cn(
                        ui.interactive,
                        'inline-flex size-5 shrink-0 items-center justify-center rounded-full p-0 opacity-90',
                        'hover:opacity-100 hover:ring-2 hover:ring-idl-border hover:ring-offset-1',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-idl-brass',
                      ),
                )}
              >
                <LocaleFlag locale={loc} size={isHeader ? 22 : FLAG_SIZE_OPTION} />
                {isHeader ? <span>{LOCALE_NAME[loc]}</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
