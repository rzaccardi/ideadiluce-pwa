import { useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Button } from '@/components/Button'

type Props = {
  orderId: string
  returnUrl: string
  onError: (message: string) => void
}

export function StripePaymentForm({ orderId, returnUrl, onError }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setBusy(true)
    onError('')
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })
    if (error) {
      onError(error.message ?? 'Pagamento non riuscito')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      <Button type="button" disabled={!stripe || busy} onClick={() => void handlePay()}>
        {busy ? 'Pagamento in corso…' : 'Paga ora'}
      </Button>
      <p className="text-xs text-zinc-500">
        Ordine {orderId.slice(0, 8)}… — pagamento gestito in modo sicuro da Stripe.
      </p>
    </div>
  )
}
