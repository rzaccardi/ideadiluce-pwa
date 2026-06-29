'use client'

import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from '@/lib/navigation'
import {
  siteAuth,
  siteButtons,
  siteForms,
  siteLinks,
  siteTypography,
} from '@/styles/site-ui'
import { cn } from '@/utils/cn'

export function BulbIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-[26px] w-[26px]', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18h6 M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.2 1 2h6c0-.8.4-1.4 1-2A6 6 0 0 0 12 3Z" />
    </svg>
  )
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex shrink-0 items-center text-idl-glow [&_svg]:h-[17px] [&_svg]:w-[17px]">
      {children}
    </span>
  )
}

export function EmailIcon() {
  return (
    <FieldIcon>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    </FieldIcon>
  )
}

export function LockIcon() {
  return (
    <FieldIcon>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
      </svg>
    </FieldIcon>
  )
}

export function UserIcon() {
  return (
    <FieldIcon>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    </FieldIcon>
  )
}

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

export function AuthPageShell({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className={siteAuth.shell}>
      <div className={siteAuth.glow} aria-hidden>
        <div className={siteAuth.glowOrb} />
      </div>
      <div className={siteAuth.cardInner}>
        {children}
        {footer}
      </div>
    </div>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return <div className={siteAuth.card}>{children}</div>
}

export function AuthCardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      <div className={cn(siteAuth.headerIcon, 'text-idl-glow')}>
        <BulbIcon />
      </div>
      <h1 className={siteTypography.h1}>{title}</h1>
      {subtitle ? <p className={cn(siteTypography.body, 'mt-1.5 px-1 sm:px-0')}>{subtitle}</p> : null}
    </div>
  )
}

export function AuthFieldGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mb-4 sm:mb-[18px]', className)}>{children}</div>
}

export function AuthLabel({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label htmlFor={htmlFor} className={cn(siteForms.label, 'mb-1.5 block sm:mb-[7px]', className)}>
      {children}
    </label>
  )
}

export function AuthLabelRow({
  labelFor,
  label,
  action,
}: {
  labelFor: string
  label: ReactNode
  action: ReactNode
}) {
  return (
    <div className="mb-1.5 flex flex-col gap-1 sm:mb-[7px] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <AuthLabel htmlFor={labelFor} className="mb-0">
        {label}
      </AuthLabel>
      <div className="shrink-0 self-start sm:self-auto">{action}</div>
    </div>
  )
}

export function AuthField({
  icon,
  children,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn(siteForms.field, className)}>
      {icon}
      {children}
    </div>
  )
}

export function AuthTextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(siteForms.input, className)} />
}

export function AuthPasswordInput({
  showPasswordLabel,
  hidePasswordLabel,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  showPasswordLabel: string
  hidePasswordLabel: string
}) {
  const [show, setShow] = useState(false)

  return (
    <>
      <AuthTextInput {...props} type={show ? 'text' : 'password'} className={className} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? hidePasswordLabel : showPasswordLabel}
        className="flex shrink-0 items-center justify-center rounded-idl-sm p-1 text-idl-design-subtle transition hover:text-idl-ink-soft"
      >
        <EyeIcon open={show} />
      </button>
    </>
  )
}

export function AuthCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-idl-body-sm leading-snug text-idl-ink-soft sm:mb-6 sm:items-center sm:text-idl-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          siteForms.checkbox,
          'mt-0.5 sm:mt-0',
          checked ? siteForms.checkboxChecked : siteForms.checkboxUnchecked,
        )}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

export function AuthSubmitButton({
  children,
  disabled,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(siteButtons.block, siteButtons.primary, 'transition enabled:hover:bg-idl-cta-ink-hover')}
    >
      {children}
    </button>
  )
}

export function AuthFooterText({ children }: { children: ReactNode }) {
  return <div className={siteAuth.footer}>{children}</div>
}

export function AuthFooterMuted({ children }: { children: ReactNode }) {
  return <div className={siteAuth.footerMuted}>{children}</div>
}

export function AuthBrassLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link to={to} className={cn(siteLinks.brass, className)}>
      {children}
    </Link>
  )
}

export function AuthBodyText({ children }: { children: ReactNode }) {
  return <p className={cn(siteTypography.bodyLg, 'mb-5 text-idl-ink-soft sm:mb-6')}>{children}</p>
}
