import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type LogoProps = {
  className?: string
}

function BonificoBancarioLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 54 22" className={cn('h-[22px] w-auto', className)} aria-hidden>
      <text
        x="27"
        y="8"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7"
        fontWeight="800"
        letterSpacing="0.06em"
      >
        BONIFICO
      </text>
      <text
        x="27"
        y="17"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7"
        fontWeight="800"
        letterSpacing="0.06em"
      >
        BANCARIO
      </text>
    </svg>
  )
}

function MaestroLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 44 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <circle cx="17" cy="12" r="8" fill="#EB001B" />
      <circle cx="27" cy="12" r="8" fill="#0099DF" />
      <text
        x="22"
        y="25"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="5.5"
        fontWeight="600"
      >
        maestro
      </text>
    </svg>
  )
}

function MastercardLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 44 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <circle cx="17" cy="12" r="8" fill="#EB001B" />
      <circle cx="27" cy="12" r="8" fill="#F79E1B" />
      <text
        x="22"
        y="25"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="5"
        fontWeight="600"
      >
        mastercard
      </text>
    </svg>
  )
}

function UnionPayLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 44 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <rect width="44" height="28" rx="2" fill="#fff" />
      <path d="M0 0h44v11H0z" fill="#E21836" />
      <path d="M0 17h44v11H0z" fill="#007B4E" />
      <path d="M0 11h44l-8 6 8 6H0z" fill="#fff" opacity="0.95" />
      <text x="22" y="9" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="700">
        UnionPay
      </text>
      <text x="22" y="23" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="4.5">
        银联
      </text>
    </svg>
  )
}

function VisaLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 44 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <text
        x="22"
        y="19"
        textAnchor="middle"
        fill="#1A1F71"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="800"
        fontStyle="italic"
      >
        VISA
      </text>
    </svg>
  )
}

function NexiLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 36 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <text
        x="18"
        y="19"
        textAnchor="middle"
        fill="#0033A0"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="13"
        fontWeight="800"
      >
        nexi
      </text>
    </svg>
  )
}

function PayPalLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 52 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <text
        x="26"
        y="19"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="700"
        fontStyle="italic"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009CDE">Pal</tspan>
      </text>
    </svg>
  )
}

function ApplePayLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 52 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <path
        fill="currentColor"
        d="M11.8 8.2c-.5.6-1.3 1.1-2.1 1-.1-.8.3-1.6.7-2.1.5-.6 1.4-1.1 2.1-1.1.1.9-.3 1.7-.7 2.2zm.7 1.1c-1.2-.1-2.2.7-2.8.7-.6 0-1.5-.6-2.5-.6-1.3 0-2.5.8-3.1 2-.9 1.5-.2 3.8.6 5 .4.7.9 1.4 1.6 1.4.6 0 .9-.4 1.7-.4.8 0 1 .4 1.7.4.7 0 1.2-.6 1.6-1.2.5-.8.7-1.6.7-1.6 0 0-1.4-.5-1.4-2.1 0-1.3 1-2 1.1-2.1-.6-.9-1.6-1-1.9-1.1z"
      />
      <text x="20" y="18.5" fill="currentColor" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" fontWeight="600">
        Pay
      </text>
    </svg>
  )
}

function GooglePayLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 56 28" className={cn('h-7 w-auto', className)} aria-hidden>
      <text x="9" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700">
        <tspan fill="#4285F4">G</tspan>
      </text>
      <text x="24" y="18" fill="currentColor" fontFamily="Arial, Helvetica, sans-serif" fontSize="11" fontWeight="600">
        Pay
      </text>
    </svg>
  )
}

export function AmexLogo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 38 24" className={cn('h-6 w-auto', className)} aria-hidden>
      <rect width="38" height="24" rx="3" fill="#006FCF" />
      <text x="19" y="15" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700">
        AMEX
      </text>
    </svg>
  )
}

const FOOTER_PAYMENT_METHODS = [
  { id: 'bonifico', label: 'Bonifico bancario', Logo: BonificoBancarioLogo },
  { id: 'visa', label: 'Visa', Logo: VisaLogo },
  { id: 'mastercard', label: 'Mastercard', Logo: MastercardLogo },
  { id: 'apple-pay', label: 'Apple Pay', Logo: ApplePayLogo },
  { id: 'google-pay', label: 'Google Pay', Logo: GooglePayLogo },
] as const

function PaymentBadge({
  label,
  children,
  variant,
}: {
  label: string
  children: ReactNode
  variant: 'dark' | 'light'
}) {
  return (
    <div
      className={cn(
        'flex h-8 min-w-[2.75rem] shrink-0 items-center justify-center rounded-md px-2',
        variant === 'dark'
          ? 'bg-white/95 text-idl-design'
          : 'border border-idl-border bg-white text-idl-graphite',
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      {children}
    </div>
  )
}

type AcceptedPaymentMethodsProps = {
  variant?: 'dark' | 'light'
  className?: string
  showLabel?: boolean
  label?: string
}

export function AcceptedPaymentMethods({
  variant = 'dark',
  className,
  showLabel = true,
  label = 'Pagamenti sicuri',
}: AcceptedPaymentMethodsProps) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {showLabel ? (
        <span
          className={cn(
            'font-mono text-[10px] tracking-[0.12em] uppercase',
            variant === 'dark' ? 'text-idl-design-subtle' : 'text-idl-muted',
          )}
        >
          {label}
        </span>
      ) : null}
      <ul className="flex list-none flex-wrap items-center gap-2 p-0 m-0">
        {FOOTER_PAYMENT_METHODS.map(({ id, label: methodLabel, Logo }) => (
          <li key={id}>
            <PaymentBadge label={methodLabel} variant={variant}>
              <Logo className={variant === 'dark' && id === 'bonifico' ? 'text-idl-design' : undefined} />
            </PaymentBadge>
          </li>
        ))}
      </ul>
    </div>
  )
}

export {
  BonificoBancarioLogo,
  MaestroLogo,
  MastercardLogo,
  UnionPayLogo,
  VisaLogo,
  NexiLogo,
  PayPalLogo,
  ApplePayLogo,
  GooglePayLogo,
}
