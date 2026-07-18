export { dynamic, fetchCache } from '@/app/_shared/private-route'

import type { Metadata } from 'next'
import { CartPage } from '@/views/CartPage'

export const metadata: Metadata = {
  title: 'Carrello',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <CartPage />
}
