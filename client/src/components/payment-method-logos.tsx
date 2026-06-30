import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type LogoProps = {
  className?: string
}

const PAYMENT_BRAND_ICONS = {
  visa: { src: '/payment-icons/visa.svg', label: 'Visa' },
  mastercard: { src: '/payment-icons/mastercard.svg', label: 'Mastercard' },
  amex: { src: '/payment-icons/amex.svg', label: 'American Express' },
  maestro: { src: '/payment-icons/maestro.svg', label: 'Maestro' },
  paypal: { src: '/payment-icons/paypal.svg', label: 'PayPal' },
  'apple-pay': { src: '/payment-icons/apple-pay.svg', label: 'Apple Pay' },
  'google-pay': { src: '/payment-icons/google-pay.svg', label: 'Google Pay' },
} as const

type PaymentBrandId = keyof typeof PAYMENT_BRAND_ICONS

function PaymentBrandImage({ brand, className }: LogoProps & { brand: PaymentBrandId }) {
  const { src } = PAYMENT_BRAND_ICONS[brand]

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={cn('h-6 w-auto', className)}
    />
  )
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

function VisaLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="visa" className={className} />
}

function MastercardLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="mastercard" className={className} />
}

export function AmexLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="amex" className={className} />
}

function MaestroLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="maestro" className={className} />
}

function PayPalLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="paypal" className={className} />
}

function ApplePayLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="apple-pay" className={className} />
}

function GooglePayLogo({ className }: LogoProps) {
  return <PaymentBrandImage brand="google-pay" className={className} />
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
  PayPalLogo,
  VisaLogo,
  ApplePayLogo,
  GooglePayLogo,
}
