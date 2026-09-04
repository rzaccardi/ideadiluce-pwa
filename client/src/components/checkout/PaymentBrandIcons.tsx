import type { PwaPaymentMethodDTO } from '@/types/dto'
import {
  AmexLogo,
  ApplePayLogo,
  GooglePayLogo,
  MastercardLogo,
  PayPalLogo,
  VisaLogo,
} from '@/components/payment-method-logos'

type Props = {
  method: PwaPaymentMethodDTO
  className?: string
}

export function PaymentBrandIcons({ method, className }: Props) {
  if (method === 'bank_transfer') return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      {[VisaLogo, MastercardLogo, AmexLogo, ApplePayLogo, GooglePayLogo, PayPalLogo].map(
        (Logo, index) => (
          <span
            key={index}
            className="flex h-7 items-center justify-center rounded-md bg-white px-1.5"
          >
            <Logo />
          </span>
        ),
      )}
    </div>
  )
}
