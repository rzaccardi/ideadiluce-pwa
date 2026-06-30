import type { PwaPaymentMethodDTO } from '@/types/dto'
import {
  AmexLogo,
  ApplePayLogo,
  BonificoBancarioLogo,
  GooglePayLogo,
  MastercardLogo,
  VisaLogo,
} from '@/components/payment-method-logos'

type Props = {
  method: PwaPaymentMethodDTO
  className?: string
}

export function PaymentBrandIcons({ method, className }: Props) {
  if (method === 'bank_transfer') {
    return (
      <div className={className}>
        <BonificoBancarioLogo className="h-8" />
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`}>
      <VisaLogo />
      <MastercardLogo />
      <AmexLogo />
      <ApplePayLogo />
      <GooglePayLogo />
    </div>
  )
}
