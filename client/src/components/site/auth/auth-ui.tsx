'use client'

import { type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from '@/lib/navigation'
import { Button } from '@/components/Button'
import { PasswordVisibilityToggle, usePasswordVisibility } from '@/components/PasswordVisibilityToggle'
import {
  siteAuth,
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
  showPasswordLabel?: string
  hidePasswordLabel?: string
}) {
  const password = usePasswordVisibility()

  return (
    <>
      <AuthTextInput {...props} type={password.inputType} className={className} />
      <PasswordVisibilityToggle
        show={password.show}
        onToggle={password.toggle}
        showPasswordLabel={showPasswordLabel}
        hidePasswordLabel={hidePasswordLabel}
      />
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
    <Button
      type="submit"
      variant="primary"
      disabled={disabled}
      className="h-auto min-h-12 w-full rounded-idl-md px-4 py-3.5 text-center text-idl-body-lg font-bold sm:py-4 sm:text-[15.5px]"
    >
      {children}
    </Button>
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
