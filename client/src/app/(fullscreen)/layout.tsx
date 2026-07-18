export { dynamic, fetchCache } from '@/app/_shared/private-route'

import type { Metadata } from 'next'
import { FullscreenLayout } from '@/layouts/FullscreenLayout'
import { jetbrains, newsreader } from '@/lib/fonts'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${newsreader.variable} ${jetbrains.variable}`}>
      <FullscreenLayout>{children}</FullscreenLayout>
    </div>
  )
}
