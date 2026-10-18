'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { phoneFlagUrl } from '@/lib/phone-flags'
import { joinPhone, PHONE_COUNTRIES, splitPhone } from '@/lib/phone-prefix'
import { useI18n } from '@/hooks/use-i18n'
import { layers } from '@/lib/layering'
import { cn } from '@/utils/cn'

type Props = {
  id?: string
  name?: string
  value: string
  onValueChange: (value: string) => void
  /** Paese iniziale se il numero non ha già un prefisso internazionale. */
  defaultCountry?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  invalid?: boolean
  autoComplete?: string
  /** `stripe` dentro i campi checkout, `plain` nei form del sito. */
  variant?: 'stripe' | 'plain'
  className?: string
}

function Flag({ country }: { country: string }) {
  const src = phoneFlagUrl(country)
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="block size-5 shrink-0 rounded-full"
      decoding="async"
    />
  )
}

export function PhonePrefixField({
  id,
  name,
  value,
  onValueChange,
  defaultCountry = 'IT',
  placeholder = '333 1234567',
  required,
  disabled,
  invalid,
  autoComplete = 'tel',
  variant = 'stripe',
  className,
}: Props) {
  const { t } = useI18n()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [mounted, setMounted] = useState(false)
  const parsed = splitPhone(value, defaultCountry)
  const [country, setCountry] = useState(parsed.country)
  const [national, setNational] = useState(parsed.national)
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (focused) return
    setCountry(parsed.country)
    setNational(parsed.national)
  }, [focused, parsed.country, parsed.national])

  useEffect(() => {
    if (!open) return

    const place = () => {
      const anchor = rootRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const width = Math.max(rect.width, 260)
      const menuHeight = 280
      const spaceBelow = window.innerHeight - rect.bottom
      const top =
        spaceBelow < menuHeight && rect.top > spaceBelow
          ? Math.max(8, rect.top - menuHeight - 4)
          : rect.bottom + 4
      setMenuBox({ top, left: rect.left, width })
    }

    place()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if ((target as HTMLElement).closest?.(`[data-phone-prefix="${listId}"]`)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, listId])

  const selected = PHONE_COUNTRIES.find((item) => item.code === country) ?? PHONE_COUNTRIES[0]
  const dialLabel = `+${selected?.dial ?? '39'}`

  function commit(nextCountry: string, nextNational: string) {
    setCountry(nextCountry)
    setNational(nextNational)
    onValueChange(joinPhone(nextCountry, nextNational))
  }

  function onNationalChange(raw: string) {
    const trimmed = raw.trim()
    if (trimmed.startsWith('+') || trimmed.startsWith('00')) {
      const next = splitPhone(trimmed, country)
      commit(next.country, next.national)
      return
    }
    commit(country, raw.replace(/[^\d\s]/g, ''))
  }

  const menu =
    open && mounted && menuBox
      ? createPortal(
          <div
            data-phone-prefix={listId}
            id={listId}
            role="listbox"
            aria-label={t('common.phonePrefix')}
            style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
            className={cn(
              'fixed max-h-[280px] overflow-y-auto rounded-[12px] border border-idl-tech-border bg-idl-tech-panel p-1 shadow-[0_16px_40px_rgba(0,0,0,0.16)]',
              layers.dialog,
            )}
          >
            {PHONE_COUNTRIES.map((item) => {
              const active = item.code === country
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    commit(item.code, national)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] text-idl-graphite',
                    active ? 'bg-idl-cream font-semibold' : 'hover:bg-idl-cream/70',
                  )}
                >
                  <Flag country={item.code} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="shrink-0 tabular-nums text-idl-muted">+{item.dial}</span>
                </button>
              )
            })}
          </div>,
          document.body,
        )
      : null

  return (
    <div
      ref={rootRef}
      className={cn(
        variant === 'stripe'
          ? 'idl-field flex w-full items-center gap-0 px-0'
          : 'flex w-full items-center gap-0 rounded-lg border border-idl-border bg-idl-tech-panel px-0 text-idl-graphite outline-none transition focus-within:border-idl-brass focus-within:ring-2 focus-within:ring-idl-brass/20',
        invalid && 'border-red-500 ring-2 ring-red-200',
        disabled && 'opacity-60',
        className,
      )}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={t('common.phonePrefix')}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex shrink-0 items-center gap-1.5 py-3.5 pr-2 pl-[15px] text-[15px] font-semibold text-idl-graphite outline-none"
      >
        <Flag country={country} />
        <span className="tabular-nums">{dialLabel}</span>
        <span className="text-[10px] text-idl-muted" aria-hidden>
          ▾
        </span>
      </button>
      <span className="h-5 w-px shrink-0 bg-idl-tech-border" aria-hidden />
      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        value={focused ? national : parsed.national}
        onChange={(event) => onNationalChange(event.target.value)}
        onFocus={() => {
          setFocused(true)
          setNational(splitPhone(value, defaultCountry).national)
          setCountry(splitPhone(value, defaultCountry).country)
        }}
        onBlur={() => setFocused(false)}
        className="min-w-0 flex-1 border-0 bg-transparent py-3.5 pr-[15px] pl-3 text-[15px] text-inherit outline-none placeholder:text-idl-placeholder"
      />
      {menu}
    </div>
  )
}
