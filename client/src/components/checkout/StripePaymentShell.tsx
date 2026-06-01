import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { StripePaymentForm } from './StripePaymentForm'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

type Props = {
  clientSecret: string
  orderId: string
  onError: (message: string) => void
}

export function StripePaymentShell({ clientSecret, orderId, onError }: Props) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-red-700">
        Configura <code className="font-mono text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> per abilitare i
        pagamenti Stripe.
      </p>
    )
  }

  const returnUrl = `${window.location.origin}/checkout/result/${orderId}`

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm orderId={orderId} returnUrl={returnUrl} onError={onError} />
    </Elements>
  )
}
