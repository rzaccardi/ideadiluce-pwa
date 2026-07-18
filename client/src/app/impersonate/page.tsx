import type { Metadata } from 'next'
import { ImpersonatePage } from '@/views/ImpersonatePage'

export const metadata: Metadata = {
  title: 'Accesso assistito',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ImpersonatePage />
}
