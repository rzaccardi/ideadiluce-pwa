'use client'

import { useState } from 'react'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

type ToggleProps = {
  show: boolean
  onToggle: () => void
  showPasswordLabel?: string
  hidePasswordLabel?: string
  className?: string
}

export function PasswordVisibilityToggle({
  show,
  onToggle,
  showPasswordLabel,
  hidePasswordLabel,
  className,
}: ToggleProps) {
  const { t } = useI18n()

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? (hidePasswordLabel ?? t('login.hidePassword')) : (showPasswordLabel ?? t('login.showPassword'))}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-idl-sm p-1 text-idl-design-subtle transition hover:text-idl-ink-soft',
        className,
      )}
    >
      <EyeIcon open={show} />
    </button>
  )
}

export function usePasswordVisibility(initial = false) {
  const [show, setShow] = useState(initial)
  return {
    show,
    toggle: () => setShow((v) => !v),
    inputType: show ? ('text' as const) : ('password' as const),
  }
}
