export { dynamic, fetchCache } from '@/app/_shared/private-route'

import { FullscreenLayout } from '@/layouts/FullscreenLayout'
import { jetbrains, newsreader } from '@/lib/fonts'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${newsreader.variable} ${jetbrains.variable}`}>
      <FullscreenLayout>{children}</FullscreenLayout>
    </div>
  )
}
