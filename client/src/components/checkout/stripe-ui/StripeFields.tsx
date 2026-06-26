'use client'

import type { ReactNode } from 'react'
import { useLocalControlledField } from '@/hooks/use-local-controlled-field'
import { ToastOnError } from '@/components/ToastFeedback'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  children: ReactNode
  className?: string
  allowOverflow?: boolean
}

/** Contenitore input raggruppati — bordo condiviso stile mock. */
export function StripeFieldGroup({ children, className, allowOverflow }: Props) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[11px] border border-[#e2e6eb] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.02)]',
        '[&>*+*]:border-t [&>*+*]:border-[#e2e6eb]',
        !allowOverflow && 'overflow-hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StripeSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1 text-xl font-extrabold tracking-[-0.01em] text-[#14161b]">{children}</h2>
  )
}

export function StripeSectionSubtitle({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-sm text-[#6c727c]">{children}</p>
}

export function StripeFieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-[#14161b]">
      {children}
    </label>
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  noBorder?: boolean
}

export function StripeInput({ className, noBorder, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'idl-field block w-full px-[15px] py-3.5 text-[15px] outline-none',
        'focus:ring-2 focus:ring-[#f0ad57]/35 focus:ring-inset',
        !noBorder && 'border-0',
        className,
      )}
      {...props}
    />
  )
}

type ControlledInputProps = Omit<InputProps, 'value' | 'defaultValue' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
  /** Normalizza al blur (es. maiuscole) senza spostare il cursore durante la digitazione. */
  normalize?: (value: string) => string
}

/** Input checkout collegato a store globali — mantiene il cursore durante l'editing. */
export function StripeControlledInput({
  value,
  onValueChange,
  normalize,
  onFocus,
  onBlur,
  ...props
}: ControlledInputProps) {
  const field = useLocalControlledField(value, onValueChange, { normalize })

  return (
    <StripeInput
      {...props}
      value={field.value}
      onChange={field.onChange}
      onFocus={(e) => {
        field.onFocus(e)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        field.onBlur(e)
        onBlur?.(e)
      }}
    />
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function StripeSelect({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'idl-field block w-full appearance-none bg-[length:12px] bg-[right_12px_center] bg-no-repeat px-[15px] py-3.5 text-[15px] outline-none',
        'focus:ring-2 focus:ring-[#f0ad57]/35 focus:ring-inset',
        "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22%3E%3Cpath fill=%22%236c727c%22 d=%22M2.5 4.5 6 8l3.5-3.5%22/%3E%3C/svg%3E')]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function StripeDivider({ label }: { label?: string }) {
  if (!label) {
    return <hr className="my-6 border-0 border-t border-zinc-200" />
  }
  return (
    <div className="relative my-6">
      <hr className="border-0 border-t border-zinc-200" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-zinc-500">
        {label}
      </span>
    </div>
  )
}

/** Altezza condivisa tra indietro e CTA principale in checkout. */
export const checkoutActionControlClass = 'min-h-[52px]'

export function CheckoutActionRow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('mt-5 flex items-stretch gap-2.5 sm:mt-6 sm:gap-3', className)}>{children}</div>
}

export function StripePayButton({
  children,
  disabled,
  loading,
  onClick,
  className,
  variant = 'primary',
}: {
  children: ReactNode
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'pay'
}) {
  const isPay = variant === 'pay'
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        'w-full rounded-xl px-4 py-4 text-base font-extrabold text-white transition',
        checkoutActionControlClass,
        isPay
          ? 'bg-[#d9831a] hover:bg-[#c2730f]'
          : 'bg-[#14161b] hover:bg-[#2a2d35]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        loading && 'opacity-80',
        className,
      )}
    >
      {children}
    </button>
  )
}

function BackArrowIcon() {
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.5 15L7.5 10L12.5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function StripeBackButton({
  children,
  onClick,
  className,
  disabled,
  'aria-label': ariaLabel,
}: {
  children?: ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  'aria-label'?: string
}) {
  const { t } = useI18n()
  const label = ariaLabel ?? t('common.back')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex w-12 shrink-0 items-center justify-center rounded-xl border border-[#e2e6eb] bg-white text-lg text-[#6c727c] transition sm:w-[54px] sm:text-xl',
        checkoutActionControlClass,
        'hover:border-[#14161b] hover:text-[#14161b]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {children ?? <BackArrowIcon />}
    </button>
  )
}

export function StripeCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-[#14161b]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-[#c0c5cc] text-[#14161b] focus:ring-[#f0ad57]/40"
      />
      <span>{label}</span>
    </label>
  )
}

export function StripeErrorBanner({ message }: { message: string | null | undefined }) {
  return <ToastOnError message={message} />
}
