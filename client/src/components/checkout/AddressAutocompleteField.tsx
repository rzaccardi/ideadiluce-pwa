'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import {
  getAddressAutocompleteProvider,
  getLastAddressSearchSetupHint,
  setAddressAutocompleteSessionTokenFactory,
} from '@/lib/addressAutocomplete'
import type { AddressSuggestion, ResolvedAddress } from '@/lib/addressAutocomplete'

function newSessionToken() {
  return crypto.randomUUID()
}

type Props = {
  label: string
  name?: string
  value: string
  countryBias?: string
  disabled?: boolean
  autoComplete?: string
  placeholder?: string
  variant?: 'default' | 'stripe'
  className?: string
  onChange: (value: string) => void
  onResolved: (address: ResolvedAddress) => void
  onSetupHint?: (hint: string | null) => void
}

type DropdownRect = { top: number; left: number; width: number }

export function AddressAutocompleteField({
  label,
  name,
  value,
  countryBias,
  disabled,
  autoComplete = 'address-line1',
  placeholder,
  variant = 'default',
  className,
  onChange,
  onResolved,
  onSetupHint,
}: Props) {
  const { t } = useI18n()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null)
  const sessionTokenRef = useRef(newSessionToken())
  const provider = getAddressAutocompleteProvider()
  const isStripe = variant === 'stripe'

  useEffect(() => {
    setAddressAutocompleteSessionTokenFactory(() => sessionTokenRef.current)
    return () => setAddressAutocompleteSessionTokenFactory(() => undefined)
  }, [])

  const inputClass = isStripe
    ? 'block w-full bg-white px-3 py-3 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-amber-300/60 focus:ring-inset disabled:opacity-60'
    : 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60'

  function updateDropdownRect() {
    const el = inputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!open) {
      setDropdownRect(null)
      return
    }
    updateDropdownRect()
    window.addEventListener('scroll', updateDropdownRect, true)
    window.addEventListener('resize', updateDropdownRect)
    return () => {
      window.removeEventListener('scroll', updateDropdownRect, true)
      window.removeEventListener('resize', updateDropdownRect)
    }
  }, [open, suggestions.length])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function scheduleSearch(query: string) {
    if (!provider) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void runSearch(query)
    }, 280)
  }

  async function runSearch(query: string) {
    if (!provider || query.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const hits = await provider.search(query, {
        country: countryBias,
        sessionToken: sessionTokenRef.current,
      })
      setSuggestions(hits)
      setOpen(hits.length > 0)
      setActiveIndex(-1)
      onSetupHint?.(getLastAddressSearchSetupHint())
    } finally {
      setLoading(false)
    }
  }

  async function pickSuggestion(item: AddressSuggestion) {
    if (!provider) return
    setOpen(false)
    setSuggestions([])

    let resolved = item.resolved
    if (!resolved && provider.resolve) {
      setResolving(true)
      try {
        resolved = (await provider.resolve(item.id, item.provider ?? 'google', sessionTokenRef.current)) ?? undefined
      } finally {
        setResolving(false)
      }
    }

    if (!resolved) return
    sessionTokenRef.current = newSessionToken()
    onChange(resolved.line1)
    onResolved(resolved)
  }

  const dropdown =
    open && suggestions.length > 0 && dropdownRect
      ? createPortal(
          <ul
            ref={dropdownRef}
            id={listId}
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 9999,
            }}
            className="max-h-56 overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2.5 text-left text-sm text-zinc-900 hover:bg-zinc-50',
                    index === activeIndex && 'bg-amber-50',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    void pickSuggestion(item)
                  }}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className={cn('relative block text-left text-sm', className)}>
      {!isStripe ? (
        <label htmlFor={name} className="mb-1 block font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <input
        ref={inputRef}
        id={name}
        name={name}
        role={provider ? 'combobox' : undefined}
        aria-expanded={provider ? open : undefined}
        aria-controls={provider ? listId : undefined}
        aria-autocomplete={provider ? 'list' : undefined}
        value={value}
        disabled={disabled || resolving}
        autoComplete={autoComplete}
        placeholder={
          placeholder ??
          (isStripe
            ? provider
              ? t('checkout.address.searchPlaceholder')
              : t('checkout.address.label')
            : provider
              ? t('checkout.address.typeToSearch')
              : t('checkout.address.label'))
        }
        onChange={(e) => {
          onChange(e.target.value)
          if (provider) scheduleSearch(e.target.value)
        }}
        onFocus={() => {
          if (provider && suggestions.length > 0) setOpen(true)
        }}
        onKeyDown={(e) => {
          if (!provider || !open || suggestions.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault()
            void pickSuggestion(suggestions[activeIndex]!)
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        className={inputClass}
      />
      {provider && (loading || resolving) ? (
        <span
          className={cn(
            'pointer-events-none absolute right-3 text-xs text-[#a3acb9]',
            isStripe ? 'top-1/2 -translate-y-1/2' : 'top-[2.35rem]',
          )}
        >
          …
        </span>
      ) : null}
      {dropdown}
    </div>
  )
}
