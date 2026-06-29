import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { CheckoutStripeBootstrapSkeleton } from '@/components/Skeleton'
import { buildMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Checkout',
  noindex: true,
})

const CheckoutPage = dynamic(
  () => import('@/views/CheckoutPage').then((mod) => mod.CheckoutPage),
  {
    loading: () => (
      <div className="checkout-root min-h-screen bg-white">
        <CheckoutStripeBootstrapSkeleton />
      </div>
    ),
  },
)

export default function Page() {
  return <CheckoutPage />
}
