import dynamic from 'next/dynamic'
import { CheckoutStripeBootstrapSkeleton } from '@/components/Skeleton'

const CheckoutQuotePage = dynamic(
  () => import('@/views/CheckoutQuotePage').then((mod) => mod.CheckoutQuotePage),
  {
    loading: () => (
      <div className="checkout-root min-h-screen bg-idl-tech-panel">
        <CheckoutStripeBootstrapSkeleton />
      </div>
    ),
  },
)

export default function Page() {
  return <CheckoutQuotePage />
}
