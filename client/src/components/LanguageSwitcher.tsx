'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { PWA_LOCALES, LOCALE_LABEL, LOCALE_NAME, HTML_LANG, type PwaLocale } from '@/lib/locale'
import { localeFlagUrl } from '@/lib/locale-flags'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { layers } from '@/lib/layering'

const FLAG_SIZE_TRIGGER = 24
const FLAG_SIZE_OPTION = 20

function LocaleFlag({
  locale,
  size,
}: {
  locale: PwaLocale
  size: typeof FLAG_SIZE_TRIGGER | typeof FLAG_SIZE_OPTION | 22 | 16
}) {
  const px =
    size === FLAG_SIZE_TRIGGER
      ? 'size-6'
      : size === 22
        ? 'size-[22px]'
        : size === 16
          ? 'size-4'
          : 'size-5'
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
  variant?: 'icon' | 'header' | 'utilityBar' | 'mobileNav'
  onOpenChange?: (open: boolean) => void
  /** Chiamato dopo la selezione di una lingua (es. chiudere il menu mobile). */
  onLocaleChange?: () => void
}

export function LanguageSwitcher({ variant = 'icon', onOpenChange, onLocaleChange }: Props) {
  const { locale, switchLocale } = useLocale()
  const { t, tParams } = useI18n()
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
  const isUtilityBar = variant === 'utilityBar'
  const isMobileNav = variant === 'mobileNav'
  const isLabeled = isHeader || isUtilityBar
  const otherLocales = PWA_LOCALES.filter((loc) => loc !== locale)

  if (isMobileNav) {
    return (
      <div className="flex items-center gap-3 py-1">
        <LocaleFlag locale={locale} size={22} />
        <div className="relative min-w-0 flex-1">
          <select
            id={listId}
            value={locale}
            onChange={(event) => selectLocale(event.target.value as PwaLocale)}
            aria-label={tParams('language.switcher.current', { locale: LOCALE_NAME[locale] })}
            className={cn(
              ui.interactive,
              'w-full appearance-none rounded-lg border border-idl-border bg-idl-tech-panel py-2.5 pr-8 pl-3 text-[14px] font-medium text-idl-ink outline-none',
              'focus:border-idl-brass focus:ring-2 focus:ring-idl-brass/20',
            )}
          >
            {PWA_LOCALES.map((loc) => (
              <option key={loc} value={loc} lang={HTML_LANG[loc]}>
                {LOCALE_NAME[loc]}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-idl-muted"
            aria-hidden
          >
            ▾
          </span>
        </div>
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
          isUtilityBar
            ? ui.utilityBarLink
            : ui.headerAction,
          isHeader
            ? ui.headerActionBtn
            : !isUtilityBar
              ? cn(
                  'size-6 rounded-full p-0 ring-2 ring-idl-ink ring-offset-2 ring-offset-idl-paper focus-visible:outline-idl-brass',
                  open && 'ring-idl-brass',
                )
              : undefined,
        )}
      >
        <LocaleFlag
          locale={locale}
          size={isUtilityBar ? 16 : isHeader ? 22 : FLAG_SIZE_TRIGGER}
        />
        {isLabeled ? (
          <>
            <span
              className={cn(
                isHeader && ui.headerActionText,
                isHeader && 'text-[12.5px] tracking-wide',
                isUtilityBar && 'text-[12.5px]',
              )}
              lang={isUtilityBar ? HTML_LANG[locale] : undefined}
            >
              {isUtilityBar ? LOCALE_NAME[locale] : LOCALE_LABEL[locale]}
            </span>
            {/* <span
              className={cn(
                isHeader && ui.headerActionText,
                'text-[9px] opacity-60',
              )}
              aria-hidden
            >
              ▾
            </span> */}
          </>
        ) : null}
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t('language.switcher.other')}
          className={cn(
            isLabeled
              ? cn(
                  'absolute right-0 w-[188px] rounded-[14px] border border-idl-border bg-idl-paper p-2 shadow-[0_20px_54px_rgba(0,0,0,0.2)]',
                  layers.headerDropdown,
                  'top-full mt-2',
                )
              : cn(
                  'absolute right-0 top-full mt-2 flex w-max flex-col gap-1.5 rounded-xl border border-idl-border bg-idl-tech-panel p-1 shadow-lg shadow-idl-ink/10',
                  layers.headerDropdown,
                ),
          )}
        >
          {otherLocales.map((loc) => (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={false}
                lang={HTML_LANG[loc]}
                title={LOCALE_NAME[loc]}
                onClick={() => selectLocale(loc)}
                className={cn(
                  ui.navButton,
                  isLabeled
                    ? cn(ui.headerDropdownItem, 'px-2.5')
                    : cn(
                        ui.interactive,
                        'inline-flex size-5 shrink-0 items-center justify-center rounded-full p-0 opacity-90',
                        'hover:opacity-100 hover:ring-2 hover:ring-idl-border hover:ring-offset-1',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-idl-brass',
                      ),
                )}
              >
                <LocaleFlag locale={loc} size={isLabeled ? 22 : FLAG_SIZE_OPTION} />
                {isLabeled ? <span lang={HTML_LANG[loc]}>{LOCALE_NAME[loc]}</span> : null}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  )
}
