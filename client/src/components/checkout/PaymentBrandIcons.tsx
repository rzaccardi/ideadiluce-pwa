import type { PwaPaymentMethodDTO } from '@/types/dto'

type Props = {
  method: PwaPaymentMethodDTO
  className?: string
}

function VisaIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-hidden>
      <rect width="38" height="24" rx="3" fill="#1A1F71" />
      <text x="19" y="16" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700">
        VISA
      </text>
    </svg>
  )
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-hidden>
      <rect width="38" height="24" rx="3" fill="#fff" stroke="#e4e4e7" />
      <circle cx="15" cy="12" r="7" fill="#EB001B" opacity="0.9" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" opacity="0.9" />
    </svg>
  )
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-hidden>
      <rect width="38" height="24" rx="3" fill="#006FCF" />
      <text x="19" y="15" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700">
        AMEX
      </text>
    </svg>
  )
}

function ApplePayIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-hidden>
      <rect width="38" height="24" rx="3" fill="#000" />
      <text x="19" y="15" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="600">
         Pay
      </text>
    </svg>
  )
}

function GooglePayIcon() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-hidden>
      <rect width="38" height="24" rx="3" fill="#fff" stroke="#e4e4e7" />
      <text x="19" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="600">
        <tspan fill="#4285F4">G</tspan>
        <tspan fill="#EA4335">o</tspan>
        <tspan fill="#FBBC04">o</tspan>
        <tspan fill="#4285F4">g</tspan>
        <tspan fill="#34A853">l</tspan>
        <tspan fill="#EA4335">e</tspan>
        <tspan fill="#5f6368"> Pay</tspan>
      </text>
    </svg>
  )
}

function BankTransferIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect width="32" height="32" rx="6" fill="#f4f4f5" />
      <path
        d="M6 14l10-6 10 6v2H6v-2zm2 4h4v8H8v-8zm6 0h4v8h-4v-8zm6 0h4v8h-4v-8z"
        fill="#52525b"
      />
    </svg>
  )
}

export function PaymentBrandIcons({ method, className }: Props) {
  if (method === 'bank_transfer') {
    return (
      <div className={className}>
        <BankTransferIcon />
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      <VisaIcon />
      <MastercardIcon />
      <AmexIcon />
      <ApplePayIcon />
      <GooglePayIcon />
    </div>
  )
}
