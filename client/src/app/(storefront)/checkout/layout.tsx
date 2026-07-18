export { dynamic, fetchCache } from '@/app/_shared/private-route'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
