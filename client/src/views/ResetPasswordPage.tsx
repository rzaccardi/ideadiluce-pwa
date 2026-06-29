'use client'

import { ResetPasswordPageView } from '@/components/site/auth/ResetPasswordPageView'
import { FadeIn } from '@/components/motion'

export function ResetPasswordPage() {
  return (
    <FadeIn>
      <ResetPasswordPageView />
    </FadeIn>
  )
}
